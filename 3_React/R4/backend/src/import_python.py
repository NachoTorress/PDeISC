import os
import mysql.connector

sql_file_path = os.path.join(os.path.dirname(__file__), '../export_mysql.sql')

with open(sql_file_path, 'r', encoding='utf8') as f:
    sql_script = f.read()

print("Conectando a Aiven MySQL...")

try:
    conn = mysql.connector.connect(
        host='mysql-3ac80aa-ignaciogatorres-ae57.c.aivencloud.com',
        port=13512,
        user='avnadmin',
        password='AVNS_9gnYSujlNRaXOxMpmkO',
        database='defaultdb',
        use_pure=True,
        ssl_disabled=False
    )
    print("Conexion exitosa a Aiven MySQL!")

    cursor = conn.cursor()
    statements = [s.strip() for s in sql_script.split(';') if s.strip() and not s.strip().startswith('--')]

    for stmt in statements:
        print("Ejecutando:", stmt[:40] + "...")
        cursor.execute(stmt)

    conn.commit()
    print("\n================================================")
    print("  MIGRACION Y CREACION DE ADMIN (nacho87) EXITO ")
    print("================================================")
    conn.close()

except Exception as e:
    print("Error:", e)
