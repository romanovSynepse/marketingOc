"""Outreach: ресёрч бренда и персональное первое касание. Отправка только после апрува Ника."""
import smtplib
from email.message import EmailMessage

from pydantic import BaseModel

from .. import config, db, llm

ROLE = """Роль: Outreach / SDR. Пишешь первое касание бренду из ICP (product.md) от лица Ника.
Сначала изучи бренд в вебе: что продают, где их контент, сколько роликов выходит, какие слабые места в органике.
Письмо: 60–110 слов, одна конкретная деталь про бренд, одна цифра из кейса, один простой CTA
(15-минутное демо на их товаре). Без вложений, без «Dear Sir», без давления. Тема до 6 слов."""


class Pitch(BaseModel):
    fit_score: int  # 1–10
    why_fit: str
    contact_hint: str
    subject: str
    message: str


def draft(brand: str, website: str = "", notes: str = "", language: str = "RU",
          sender: str = "") -> dict:
    task = f"Бренд: {brand}\nСайт: {website}\nЗаметки: {notes}\nЯзык письма: {language}"
    pitch = llm.run(ROLE, task, Pitch, effort="medium", web=True)
    row = db.insert("outreach_leads", {
        "brand": brand, "website": website, "segment": notes[:200], "fit_score": pitch.fit_score,
        "why_fit": pitch.why_fit, "contact": pitch.contact_hint, "subject": pitch.subject,
        "message": pitch.message, "status": "drafted", "sender_account": sender or config.OUTREACH_FROM,
    })
    db.log_run("outreach", task, f"{brand}: fit {pitch.fit_score}")
    return row


def send_approved() -> int:
    """Отправляет лиды со статусом approved, у которых в contact указан email. Лимит в день из конфига."""
    sent_today = db.query("SELECT COUNT(*) n FROM outreach_leads WHERE sent_at::date = CURRENT_DATE")[0]["n"]
    budget = max(0, config.OUTREACH_DAILY_CAP - sent_today)
    leads = db.query("SELECT * FROM outreach_leads WHERE status='approved' AND contact LIKE '%%@%%' "
                     "ORDER BY fit_score DESC LIMIT %s", (budget,))
    if not leads or not config.SMTP_HOST:
        return 0
    sent = 0
    with smtplib.SMTP(config.SMTP_HOST, config.SMTP_PORT) as smtp:
        smtp.starttls()
        smtp.login(config.SMTP_USER, config.SMTP_PASSWORD)
        for lead in leads:
            msg = EmailMessage()
            msg["From"], msg["To"], msg["Subject"] = config.OUTREACH_FROM, lead["contact"], lead["subject"]
            msg.set_content(f"{lead['message']}\n\n--\n{config.OUTREACH_FOOTER}")
            smtp.send_message(msg)
            db.query("UPDATE outreach_leads SET status='sent', sent_at=NOW() WHERE id=%s", (lead["id"],))
            sent += 1
    return sent
