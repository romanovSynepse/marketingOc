"""
Единый API для РнП Маркетинг.
Параметр ?resource=clients|influencers|weekly-stats|kpi|channels|rfm|cjm|swot|pest|smart|target-audience|mediaplan|content-matrix|products
"""
import json
import os
import psycopg2

CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
}

def get_conn():
    return psycopg2.connect(os.environ['DATABASE_URL'])

def ok(data):
    return {'statusCode': 200, 'headers': {**CORS_HEADERS, 'Content-Type': 'application/json'}, 'body': json.dumps(data, ensure_ascii=False, default=str)}

def err(msg, code=400):
    return {'statusCode': code, 'headers': {**CORS_HEADERS, 'Content-Type': 'application/json'}, 'body': json.dumps({'error': msg}, ensure_ascii=False)}

def rows_to_list(cur):
    cols = [d[0] for d in cur.description]
    return [dict(zip(cols, row)) for row in cur.fetchall()]

def one_row(cur):
    row = cur.fetchone()
    if not row:
        return None
    return dict(zip([d[0] for d in cur.description], row))

def handler(event: dict, context) -> dict:
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': ''}

    method = event.get('httpMethod', 'GET')
    qs = event.get('queryStringParameters') or {}
    resource = qs.get('resource', '')
    rid = qs.get('id')

    body = {}
    if event.get('body'):
        try:
            body = json.loads(event['body'])
        except Exception:
            pass

    conn = get_conn()
    cur = conn.cursor()

    try:
        # ── CLIENTS ─────────────────────────────────────────────────────────
        if resource == 'clients':
            if method == 'GET':
                cur.execute("SELECT * FROM clients ORDER BY created_at DESC")
                return ok(rows_to_list(cur))
            if method == 'POST':
                cur.execute(
                    "INSERT INTO clients (name,segment,status,project,budget,leads,ltv,manager) VALUES (%s,%s,%s,%s,%s,%s,%s,%s) RETURNING *",
                    (body.get('name'), body.get('segment','B2B'), body.get('status','Новый'),
                     body.get('project'), body.get('budget',0), body.get('leads',0),
                     body.get('ltv',0), body.get('manager'))
                )
                conn.commit()
                return ok(one_row(cur))
            if method == 'PUT':
                cur.execute(
                    "UPDATE clients SET name=%s,segment=%s,status=%s,project=%s,budget=%s,leads=%s,ltv=%s,manager=%s WHERE id=%s RETURNING *",
                    (body.get('name'), body.get('segment'), body.get('status'), body.get('project'),
                     body.get('budget'), body.get('leads'), body.get('ltv'), body.get('manager'), rid)
                )
                conn.commit()
                return ok(one_row(cur))
            if method == 'DELETE':
                cur.execute("DELETE FROM clients WHERE id=%s", (rid,))
                conn.commit()
                return ok({'deleted': True})

        # ── INFLUENCERS ──────────────────────────────────────────────────────
        if resource == 'influencers':
            if method == 'GET':
                cur.execute("SELECT * FROM influencers ORDER BY created_at DESC")
                return ok(rows_to_list(cur))
            if method == 'POST':
                cur.execute(
                    "INSERT INTO influencers (name,reach,cpm,leads,status) VALUES (%s,%s,%s,%s,%s) RETURNING *",
                    (body.get('name'), body.get('reach',0), body.get('cpm',0), body.get('leads',0), body.get('status','Планируется'))
                )
                conn.commit()
                return ok(one_row(cur))
            if method == 'PUT':
                cur.execute(
                    "UPDATE influencers SET name=%s,reach=%s,cpm=%s,leads=%s,status=%s WHERE id=%s RETURNING *",
                    (body.get('name'), body.get('reach'), body.get('cpm'), body.get('leads'), body.get('status'), rid)
                )
                conn.commit()
                return ok(one_row(cur))
            if method == 'DELETE':
                cur.execute("DELETE FROM influencers WHERE id=%s", (rid,))
                conn.commit()
                return ok({'deleted': True})

        # ── WEEKLY STATS ─────────────────────────────────────────────────────
        if resource == 'weekly-stats':
            if method == 'GET':
                cur.execute("SELECT * FROM marketing_weekly_stats ORDER BY id")
                return ok(rows_to_list(cur))
            if method == 'POST':
                cur.execute(
                    "INSERT INTO marketing_weekly_stats (week,budget,leads,conversions,reach,cpl,romi) VALUES (%s,%s,%s,%s,%s,%s,%s) RETURNING *",
                    (body.get('week'), body.get('budget',0), body.get('leads',0),
                     body.get('conversions',0), body.get('reach',0), body.get('cpl',0), body.get('romi',0))
                )
                conn.commit()
                return ok(one_row(cur))
            if method == 'PUT':
                cur.execute(
                    "UPDATE marketing_weekly_stats SET week=%s,budget=%s,leads=%s,conversions=%s,reach=%s,cpl=%s,romi=%s WHERE id=%s RETURNING *",
                    (body.get('week'), body.get('budget'), body.get('leads'), body.get('conversions'),
                     body.get('reach'), body.get('cpl'), body.get('romi'), rid)
                )
                conn.commit()
                return ok(one_row(cur))

        # ── KPI ──────────────────────────────────────────────────────────────
        if resource == 'kpi':
            if method == 'GET':
                cur.execute("SELECT * FROM marketing_kpi ORDER BY id")
                return ok(rows_to_list(cur))
            if method == 'PUT':
                cur.execute(
                    "UPDATE marketing_kpi SET name=%s,plan=%s,fact=%s,unit=%s WHERE id=%s RETURNING *",
                    (body.get('name'), body.get('plan'), body.get('fact'), body.get('unit'), rid)
                )
                conn.commit()
                return ok(one_row(cur))

        # ── CHANNELS ─────────────────────────────────────────────────────────
        if resource == 'channels':
            if method == 'GET':
                cur.execute("SELECT * FROM marketing_channels ORDER BY id")
                return ok(rows_to_list(cur))
            if method == 'PUT':
                cur.execute(
                    "UPDATE marketing_channels SET name=%s,value=%s,color=%s WHERE id=%s RETURNING *",
                    (body.get('name'), body.get('value'), body.get('color'), rid)
                )
                conn.commit()
                return ok(one_row(cur))

        # ── RFM ──────────────────────────────────────────────────────────────
        if resource == 'rfm':
            if method == 'GET':
                cur.execute("SELECT * FROM rfm_segments ORDER BY id")
                return ok(rows_to_list(cur))
            if method == 'PUT':
                cur.execute(
                    "UPDATE rfm_segments SET segment=%s,clients_count=%s,revenue=%s,description=%s WHERE id=%s RETURNING *",
                    (body.get('segment'), body.get('clients_count'), body.get('revenue'), body.get('description'), rid)
                )
                conn.commit()
                return ok(one_row(cur))

        # ── CJM ──────────────────────────────────────────────────────────────
        if resource == 'cjm':
            if method == 'GET':
                cur.execute("SELECT * FROM customer_journey_stages ORDER BY sort_order")
                return ok(rows_to_list(cur))
            if method == 'PUT':
                cur.execute(
                    "UPDATE customer_journey_stages SET stage=%s,touchpoint=%s,emotion=%s,action=%s,problem=%s,solution=%s,metric=%s WHERE id=%s RETURNING *",
                    (body.get('stage'), body.get('touchpoint'), body.get('emotion'), body.get('action'),
                     body.get('problem'), body.get('solution'), body.get('metric'), rid)
                )
                conn.commit()
                return ok(one_row(cur))

        # ── SWOT ─────────────────────────────────────────────────────────────
        if resource == 'swot':
            if method == 'GET':
                cur.execute("SELECT * FROM swot_items ORDER BY quadrant, sort_order")
                return ok(rows_to_list(cur))
            if method == 'POST':
                cur.execute(
                    "INSERT INTO swot_items (quadrant,content,sort_order) VALUES (%s,%s,%s) RETURNING *",
                    (body.get('quadrant'), body.get('content'), body.get('sort_order', 99))
                )
                conn.commit()
                return ok(one_row(cur))
            if method == 'PUT':
                cur.execute(
                    "UPDATE swot_items SET content=%s WHERE id=%s RETURNING *",
                    (body.get('content'), rid)
                )
                conn.commit()
                return ok(one_row(cur))
            if method == 'DELETE':
                cur.execute("DELETE FROM swot_items WHERE id=%s", (rid,))
                conn.commit()
                return ok({'deleted': True})

        # ── PEST ─────────────────────────────────────────────────────────────
        if resource == 'pest':
            if method == 'GET':
                cur.execute("SELECT * FROM pest_items ORDER BY factor, sort_order")
                return ok(rows_to_list(cur))
            if method == 'POST':
                cur.execute(
                    "INSERT INTO pest_items (factor,content,sort_order) VALUES (%s,%s,%s) RETURNING *",
                    (body.get('factor'), body.get('content'), body.get('sort_order', 99))
                )
                conn.commit()
                return ok(one_row(cur))
            if method == 'DELETE':
                cur.execute("DELETE FROM pest_items WHERE id=%s", (rid,))
                conn.commit()
                return ok({'deleted': True})

        # ── SMART ────────────────────────────────────────────────────────────
        if resource == 'smart':
            if method == 'GET':
                cur.execute("SELECT * FROM smart_goals ORDER BY created_at DESC")
                return ok(rows_to_list(cur))
            if method == 'POST':
                cur.execute(
                    "INSERT INTO smart_goals (goal,specific,measurable,achievable,relevant,time_bound,status) VALUES (%s,%s,%s,%s,%s,%s,%s) RETURNING *",
                    (body.get('goal'), body.get('specific'), body.get('measurable'), body.get('achievable'),
                     body.get('relevant'), body.get('time_bound'), body.get('status','Новый'))
                )
                conn.commit()
                return ok(one_row(cur))
            if method == 'PUT':
                cur.execute(
                    "UPDATE smart_goals SET goal=%s,specific=%s,measurable=%s,achievable=%s,relevant=%s,time_bound=%s,status=%s WHERE id=%s RETURNING *",
                    (body.get('goal'), body.get('specific'), body.get('measurable'), body.get('achievable'),
                     body.get('relevant'), body.get('time_bound'), body.get('status'), rid)
                )
                conn.commit()
                return ok(one_row(cur))
            if method == 'DELETE':
                cur.execute("DELETE FROM smart_goals WHERE id=%s", (rid,))
                conn.commit()
                return ok({'deleted': True})

        # ── TARGET AUDIENCE ──────────────────────────────────────────────────
        if resource == 'target-audience':
            if method == 'GET':
                cur.execute("SELECT * FROM target_audience_segments ORDER BY id")
                return ok(rows_to_list(cur))
            if method == 'POST':
                cur.execute(
                    "INSERT INTO target_audience_segments (name,age,geo,pain,income,channel,size) VALUES (%s,%s,%s,%s,%s,%s,%s) RETURNING *",
                    (body.get('name'), body.get('age'), body.get('geo'), body.get('pain'),
                     body.get('income'), body.get('channel'), body.get('size'))
                )
                conn.commit()
                return ok(one_row(cur))
            if method == 'DELETE':
                cur.execute("DELETE FROM target_audience_segments WHERE id=%s", (rid,))
                conn.commit()
                return ok({'deleted': True})

        # ── MEDIAPLAN ────────────────────────────────────────────────────────
        if resource == 'mediaplan':
            if method == 'GET':
                cur.execute("SELECT * FROM mediaplan ORDER BY id")
                return ok(rows_to_list(cur))
            if method == 'POST':
                cur.execute(
                    "INSERT INTO mediaplan (week,channel,format,theme,responsible,budget,reach,status) VALUES (%s,%s,%s,%s,%s,%s,%s,%s) RETURNING *",
                    (body.get('week'), body.get('channel'), body.get('format'), body.get('theme'),
                     body.get('responsible'), body.get('budget',0), body.get('reach',0), body.get('status','Планируется'))
                )
                conn.commit()
                return ok(one_row(cur))
            if method == 'PUT':
                cur.execute(
                    "UPDATE mediaplan SET week=%s,channel=%s,format=%s,theme=%s,responsible=%s,budget=%s,reach=%s,status=%s WHERE id=%s RETURNING *",
                    (body.get('week'), body.get('channel'), body.get('format'), body.get('theme'),
                     body.get('responsible'), body.get('budget'), body.get('reach'), body.get('status'), rid)
                )
                conn.commit()
                return ok(one_row(cur))
            if method == 'DELETE':
                cur.execute("DELETE FROM mediaplan WHERE id=%s", (rid,))
                conn.commit()
                return ok({'deleted': True})

        # ── CONTENT MATRIX ───────────────────────────────────────────────────
        if resource == 'content-matrix':
            if method == 'GET':
                cur.execute("SELECT * FROM content_matrix ORDER BY id")
                return ok(rows_to_list(cur))
            if method == 'PUT':
                cur.execute(
                    "UPDATE content_matrix SET type=%s,formats=%s,goal=%s,frequency=%s,examples=%s WHERE id=%s RETURNING *",
                    (body.get('type'), body.get('formats'), body.get('goal'), body.get('frequency'), body.get('examples'), rid)
                )
                conn.commit()
                return ok(one_row(cur))

        # ── PRODUCTS ─────────────────────────────────────────────────────────
        if resource == 'products':
            if method == 'GET':
                cur.execute("SELECT * FROM products ORDER BY id")
                return ok(rows_to_list(cur))
            if method == 'PUT':
                cur.execute(
                    "UPDATE products SET name=%s,price=%s,variable_cost=%s,cac=%s,fixed_cost=%s,qty=%s,ltv=%s WHERE id=%s RETURNING *",
                    (body.get('name'), body.get('price'), body.get('variable_cost'), body.get('cac'),
                     body.get('fixed_cost'), body.get('qty'), body.get('ltv'), rid)
                )
                conn.commit()
                return ok(one_row(cur))

        # ── DATA IMPORTS ─────────────────────────────────────────────────────
        if resource == 'data-imports':
            if method == 'GET':
                cur.execute("SELECT * FROM data_imports ORDER BY created_at DESC")
                return ok(rows_to_list(cur))
            if method == 'POST':
                cur.execute(
                    "INSERT INTO data_imports (name, source, status, row_count, columns, preview, raw_data) VALUES (%s,%s,%s,%s,%s,%s,%s) RETURNING *",
                    (body.get('name'), body.get('source','csv'), body.get('status','ready'),
                     body.get('row_count',0),
                     json.dumps(body.get('columns',[])),
                     json.dumps(body.get('preview',[])),
                     json.dumps(body.get('raw_data',[])))
                )
                conn.commit()
                return ok(one_row(cur))
            if method == 'DELETE':
                cur.execute("DELETE FROM data_imports WHERE id=%s", (rid,))
                conn.commit()
                return ok({'deleted': True})

        return err('resource not found', 404)

    except Exception as e:
        conn.rollback()
        return err(str(e), 500)
    finally:
        cur.close()
        conn.close()