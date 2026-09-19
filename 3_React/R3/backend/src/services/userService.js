import { pool, runQuery } from '../config/db.js';
import { createHttpError } from '../utils/httpError.js';
import { hashPassword } from '../utils/password.js';
import { calculateAgeFromDate } from '../utils/dateUtils.js';

function mapUserRow(row) {
  if (!row) {
    return null;
  }

  return {
    id: row.user_id,
    email: row.email,
    role: row.role_name,
    status: row.status,
    firstName: row.first_name,
    lastName: row.last_name,
    birthDate: row.birth_date,
    age: calculateAgeFromDate(row.birth_date),
    phone: row.phone,
    documentType: row.document_type_code,
    documentNumber: row.document_number,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

const baseUserSelect = `
  SELECT
    ua.user_id,
    ua.email,
    ua.status,
    ua.created_at,
    ua.updated_at,
    r.name AS role_name,
    up.first_name,
    up.last_name,
    up.birth_date,
    up.phone,
    up.document_number,
    dt.code AS document_type_code
  FROM user_accounts ua
  INNER JOIN roles r ON r.role_id = ua.role_id
  INNER JOIN user_profiles up ON up.user_id = ua.user_id
  INNER JOIN document_types dt ON dt.document_type_id = up.document_type_id
`;

async function getLookupId(connection, table, column, value, outputColumn) {
  const [rows] = await connection.execute(
    `SELECT ${outputColumn} AS id FROM ${table} WHERE ${column} = ? LIMIT 1`,
    [value],
  );

  if (!rows[0]) {
    throw createHttpError(400, 'Valor de catálogo inexistente.');
  }

  return rows[0].id;
}

export async function listUsers() {
  const rows = await runQuery(`${baseUserSelect} ORDER BY ua.created_at DESC`);
  return rows.map(mapUserRow);
}

export async function getUserById(id) {
  const rows = await runQuery(`${baseUserSelect} WHERE ua.user_id = ? LIMIT 1`, [id]);
  return mapUserRow(rows[0]);
}

export async function getUserWithPasswordByEmail(email) {
  const rows = await runQuery(
    `
      SELECT
        ua.user_id,
        ua.email,
        ua.password_hash,
        ua.status,
        r.name AS role_name
      FROM user_accounts ua
      INNER JOIN roles r ON r.role_id = ua.role_id
      WHERE ua.email = ?
      LIMIT 1
    `,
    [email],
  );

  return rows[0] ?? null;
}

export async function countUsers() {
  const rows = await runQuery('SELECT COUNT(*) AS total FROM user_accounts');
  return Number(rows[0].total);
}

export async function countActiveAdminsExcept(userId = null) {
  const params = [];
  let extraCondition = '';

  if (userId) {
    extraCondition = 'AND ua.user_id <> ?';
    params.push(userId);
  }

  const rows = await runQuery(
    `
      SELECT COUNT(*) AS total
      FROM user_accounts ua
      INNER JOIN roles r ON r.role_id = ua.role_id
      WHERE r.name = 'admin' AND ua.status = 'active'
      ${extraCondition}
    `,
    params,
  );

  return Number(rows[0].total);
}

/**
 * Origen: registro publico o alta desde panel admin.
 * Destino: user_accounts y user_profiles dentro de una transaccion.
 */
export async function createUser(data) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const totalUsers = await countUsers();
    const selectedRole = data.role ?? (totalUsers === 0 ? 'admin' : 'user');
    const roleId = await getLookupId(connection, 'roles', 'name', selectedRole, 'role_id');
    const documentTypeId = await getLookupId(
      connection,
      'document_types',
      'code',
      data.documentType,
      'document_type_id',
    );
    const passwordHash = await hashPassword(data.password);

    const [accountResult] = await connection.execute(
      `
        INSERT INTO user_accounts (role_id, email, password_hash, status)
        VALUES (?, ?, ?, ?)
      `,
      [roleId, data.email, passwordHash, data.status ?? 'active'],
    );

    await connection.execute(
      `
        INSERT INTO user_profiles
          (user_id, document_type_id, document_number, first_name, last_name, birth_date, phone)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
      [
        accountResult.insertId,
        documentTypeId,
        data.documentNumber,
        data.firstName,
        data.lastName,
        data.birthDate,
        data.phone ?? null,
      ],
    );

    await connection.commit();
    return getUserById(accountResult.insertId);
  } catch (error) {
    await connection.rollback();

    if (error.code === 'ER_DUP_ENTRY') {
      throw createHttpError(409, 'Ya existe un usuario con ese email o documento.');
    }

    throw error;
  } finally {
    connection.release();
  }
}

/**
 * Origen: formulario de edicion.
 * Destino: tablas normalizadas, actualizando solo los campos permitidos.
 */
export async function updateUser(id, data) {
  const currentUser = await getUserById(id);

  if (!currentUser) {
    throw createHttpError(404, 'Usuario no encontrado.');
  }

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const accountFields = [];
    const accountValues = [];

    if (data.email) {
      accountFields.push('email = ?');
      accountValues.push(data.email);
    }

    if (data.password) {
      accountFields.push('password_hash = ?');
      accountValues.push(await hashPassword(data.password));
    }

    if (data.role) {
      if (currentUser.role === 'admin' && data.role !== 'admin') {
        const remainingAdmins = await countActiveAdminsExcept(id);

        if (remainingAdmins === 0) {
          throw createHttpError(400, 'No se puede quitar el ultimo administrador activo.');
        }
      }

      const roleId = await getLookupId(connection, 'roles', 'name', data.role, 'role_id');
      accountFields.push('role_id = ?');
      accountValues.push(roleId);
    }

    if (data.status) {
      if (currentUser.role === 'admin' && data.status !== 'active') {
        const remainingAdmins = await countActiveAdminsExcept(id);

        if (remainingAdmins === 0) {
          throw createHttpError(400, 'No se puede desactivar el ultimo administrador activo.');
        }
      }

      accountFields.push('status = ?');
      accountValues.push(data.status);
    }

    if (accountFields.length > 0) {
      await connection.execute(
        `UPDATE user_accounts SET ${accountFields.join(', ')} WHERE user_id = ?`,
        [...accountValues, id],
      );
    }

    const profileFields = [];
    const profileValues = [];

    if (data.documentType) {
      const documentTypeId = await getLookupId(
        connection,
        'document_types',
        'code',
        data.documentType,
        'document_type_id',
      );
      profileFields.push('document_type_id = ?');
      profileValues.push(documentTypeId);
    }

    for (const [fieldName, columnName] of [
      ['documentNumber', 'document_number'],
      ['firstName', 'first_name'],
      ['lastName', 'last_name'],
      ['birthDate', 'birth_date'],
      ['phone', 'phone'],
    ]) {
      if (Object.prototype.hasOwnProperty.call(data, fieldName)) {
        profileFields.push(`${columnName} = ?`);
        profileValues.push(data[fieldName] || null);
      }
    }

    if (profileFields.length > 0) {
      await connection.execute(
        `UPDATE user_profiles SET ${profileFields.join(', ')} WHERE user_id = ?`,
        [...profileValues, id],
      );
    }

    await connection.commit();
    return getUserById(id);
  } catch (error) {
    await connection.rollback();

    if (error.code === 'ER_DUP_ENTRY') {
      throw createHttpError(409, 'Ese email o documento ya pertenece a otro usuario.');
    }

    throw error;
  } finally {
    connection.release();
  }
}

export async function deleteUser(id, actorId) {
  const currentUser = await getUserById(id);

  if (!currentUser) {
    throw createHttpError(404, 'Usuario no encontrado.');
  }

  if (Number(id) === Number(actorId)) {
    throw createHttpError(400, 'No podés eliminar tu propio usuario desde el panel.');
  }

  if (currentUser.role === 'admin') {
    const remainingAdmins = await countActiveAdminsExcept(id);

    if (remainingAdmins === 0) {
      throw createHttpError(400, 'No se puede eliminar el ultimo administrador activo.');
    }
  }

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();
    await connection.execute('DELETE FROM user_accounts WHERE user_id = ?', [id]);
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

