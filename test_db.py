import mysql.connector

try:
    conn = mysql.connector.connect(
        host="127.0.0.1",
        user="root",
        password="",
        database="question"
    )
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT u.email, o.is_active FROM users u JOIN organization_user ou ON u.id = ou.user_id JOIN organizations o ON ou.org_id = o.id WHERE o.is_active = 0 LIMIT 1;")
    row = cursor.fetchone()
    print("INACTIVE ORG USER:", row)
    
    cursor.execute("SELECT u.email, o.is_active FROM users u JOIN organization_user ou ON u.id = ou.user_id JOIN organizations o ON ou.org_id = o.id WHERE o.is_active = 1 LIMIT 1;")
    row = cursor.fetchone()
    print("ACTIVE ORG USER:", row)
    
except Exception as e:
    print(e)
