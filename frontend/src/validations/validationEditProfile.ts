// Función que valida los datos de cambio de contraseña
export function validatePasswordChange({
    password,
    newPassword,
    repeatNewPassword
}: {
    password: string,
    newPassword: string,
    repeatNewPassword: string
}) {
    // Objeto donde se almacenarán los errores encontrados
    const errors: Record<string, string> = {};

    // Función interna para limpiar espacios en blanco de un string
    const clean = (value: string | undefined) => (typeof value === 'string' ? value.trim() : '');

    // Se limpian los valores ingresados por el usuario
    const current = clean(password);
    const newPass = clean(newPassword);
    const repeatPass = clean(repeatNewPassword);

    // Validación: La contraseña actual es obligatoria
    if (!current) {
        errors.password = 'La contraseña actual es obligatoria';
    }

    // Validación: La nueva contraseña es obligatoria
    if (!newPass) {
        errors.newPassword = 'La nueva contraseña es obligatoria';
    }

    // Validación: La nueva contraseña debe tener al menos 6 caracteres
    if (newPass && newPass.length < 6) {
        errors.newPassword = 'La nueva contraseña debe tener al menos 6 caracteres';
    }

    // Validación: La nueva contraseña debe coincidir con la repetición
    if (newPass !== repeatPass) {
        errors.repeatNewPassword = 'Las contraseñas no coinciden';
    }

    // Se retorna el objeto con los errores encontrados (si hay)
    return errors;
}
