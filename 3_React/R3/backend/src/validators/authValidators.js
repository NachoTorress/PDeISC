import { isValidBirthDate } from '../utils/dateUtils.js';

const NAME_REGEX = /^[A-Za-zÁÉÍÓÚáéíóúÑñÜü' ]{2,50}$/u;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DOCUMENT_REGEX = /^\d{6,12}$/;
const PHONE_REGEX = /^\+?\d{7,15}$/;
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;

const allowedRoles = ['admin', 'user'];
const allowedStatuses = ['active', 'inactive'];
const allowedDocumentTypes = ['DNI', 'PAS', 'LC'];

function normalizeText(value) {
  return String(value ?? '').trim().replace(/\s+/g, ' ');
}

function addError(errors, field, message) {
  errors[field] = message;
}

export function validateLoginPayload(payload) {
  const errors = {};
  const data = {
    email: String(payload.email ?? '').trim().toLowerCase(),
    password: String(payload.password ?? ''),
  };

  if (!EMAIL_REGEX.test(data.email)) {
    addError(errors, 'email', 'Ingresá un email válido.');
  }

  if (!data.password) {
    addError(errors, 'password', 'La contraseña es obligatoria.');
  }

  return { data, errors };
}

export function validateUserPayload(payload, options = {}) {
  const {
    requirePassword = false,
    allowRole = false,
    allowStatus = false,
    partial = false,
  } = options;

  const errors = {};
  const data = {};

  const firstName = normalizeText(payload.firstName);
  const lastName = normalizeText(payload.lastName);
  const email = String(payload.email ?? '').trim().toLowerCase();
  const documentType = String(payload.documentType ?? '').trim().toUpperCase();
  const documentNumber = String(payload.documentNumber ?? '').trim();
  const birthDate = String(payload.birthDate ?? '').trim();
  const phone = String(payload.phone ?? '').trim();
  const password = String(payload.password ?? '');
  const role = String(payload.role ?? '').trim().toLowerCase();
  const status = String(payload.status ?? '').trim().toLowerCase();

  if (!partial || firstName) {
    if (!NAME_REGEX.test(firstName)) {
      addError(errors, 'firstName', 'El nombre solo puede tener letras, espacios y apostrofes.');
    } else {
      data.firstName = firstName;
    }
  }

  if (!partial || lastName) {
    if (!NAME_REGEX.test(lastName)) {
      addError(errors, 'lastName', 'El apellido solo puede tener letras, espacios y apostrofes.');
    } else {
      data.lastName = lastName;
    }
  }

  if (!partial || email) {
    if (!EMAIL_REGEX.test(email)) {
      addError(errors, 'email', 'Ingresá un email válido.');
    } else {
      data.email = email;
    }
  }

  if (requirePassword || password) {
    if (!PASSWORD_REGEX.test(password)) {
      addError(
        errors,
        'password',
        'La contraseña debe tener 8 caracteres, mayúscula, minúscula, número y símbolo.',
      );
    } else {
      data.password = password;
    }
  }

  if (!partial || documentType) {
    if (!allowedDocumentTypes.includes(documentType)) {
      addError(errors, 'documentType', 'Seleccioná un tipo de documento válido.');
    } else {
      data.documentType = documentType;
    }
  }

  if (!partial || documentNumber) {
    if (!DOCUMENT_REGEX.test(documentNumber)) {
      addError(errors, 'documentNumber', 'El documento debe tener entre 6 y 12 números positivos.');
    } else {
      data.documentNumber = documentNumber;
    }
  }

  if (!partial || birthDate) {
    if (!isValidBirthDate(birthDate)) {
      addError(errors, 'birthDate', 'La fecha no puede ser futura ni superar 120 años de edad.');
    } else {
      data.birthDate = birthDate;
    }
  }

  if (phone) {
    if (!PHONE_REGEX.test(phone)) {
      addError(errors, 'phone', 'El teléfono solo admite números y + al inicio.');
    } else {
      data.phone = phone;
    }
  } else if (!partial) {
    data.phone = null;
  }

  if (allowRole && role) {
    if (!allowedRoles.includes(role)) {
      addError(errors, 'role', 'Seleccioná un rol válido.');
    } else {
      data.role = role;
    }
  }

  if (allowStatus && status) {
    if (!allowedStatuses.includes(status)) {
      addError(errors, 'status', 'Seleccioná un estado válido.');
    } else {
      data.status = status;
    }
  }

  return { data, errors };
}

export function hasValidationErrors(errors) {
  return Object.keys(errors).length > 0;
}

