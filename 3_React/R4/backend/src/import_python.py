import mysql.connector
import os

sql_file_path = os.path.join(os.path.dirname(__file__), '../export_mysql.sql')

with open(sql_file_path, 'r', encoding='utf8') as f:
    sql_script = f.read()

print("Conectando a Aiven MySQL con mysql.connector y use_pure=True...")

try:
    config = {
        'user': 'avnadmin',
        'password': 'AVNS_9gnYSujlNRaXOxMpmkO',
        'host': 'mysql-3ac80aa-ignaciogatorres-ae57.c.aivencloud.com',
        'port': 13512,
        'database': 'defaultdb',
        'use_pure': True,
        'ssl_disabled': False
    }

    conn = mysql.connector.connect(**config)
    print("Conexion exitosa a Aiven MySQL.")

    cursor = conn.cursor()
    statements = [s.strip() for s in sql_script.split(';') if s.strip() and not s.strip().startswith('--')]

    for stmt in statements:
        cursor.execute(stmt)

    conn.commit()
    print("--- MIGRACION COMPLETADA CON EXITO A AIVEN MYSQL ---")
    conn.close()

except Exception as e:
    print("Error:", e)
