export function validatePasswordChange({ password, newPassword, repeatNewPassword }: { password: string, newPassword: string, repeatNewPassword: string }) {
    const errors: Record<string, string> = {};

    const clean = (value: string | undefined) => (typeof value === 'string' ? value.trim() : '');

    const current = clean(password);
    const newPass = clean(newPassword);
    const repeatPass = clean(repeatNewPassword);

    if (!current) {
        errors.password = 'La contraseña actual es obligatoria';
    }
    if (!newPass) {
        errors.newPassword = 'La nueva contraseña es obligatoria';
    }
    if (newPass && newPass.length < 6) {
        errors.newPassword = 'La nueva contraseña debe tener al menos 6 caracteres';
    }
    if (newPass !== repeatPass) {
        errors.repeatNewPassword = 'Las contraseñas no coinciden';
    }

    return errors;
}
