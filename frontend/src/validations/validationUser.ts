interface FormValues {
    nickName: string
    email: string
    password: string
    repeatPassword: string
}

interface ValidationErrors {
    nickName?: string
    email?: string
    password?: string
    repeatPassword?: string
}

export function validateForm(values: FormValues): ValidationErrors {
    const errors: ValidationErrors = {}

    // Validar nickName
    if (!values.nickName.trim()) {
        errors.nickName = 'El campo nickName no puede ir en blanco'
    } else if (values.nickName.trim().length < 4) {
        errors.nickName = ' Debe contener al menos 4 caracteres'
    }

    // Validar email
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!values.email.trim()) {
        errors.email = 'El email es obligatorio'
    } else if (!emailRegex.test(values.email)) {
        errors.email = 'El email no es válido. Ej: nickName@gmail.com'
    }

    // Validar password
    const passwordRegex = /^(?=.*[A-Z])(?=.*\d).{8,}$/
    if (!values.password) {
        errors.password = 'La contraseña es obligatoria'
    } else if (!passwordRegex.test(values.password)) {
        errors.password = 'La contraseña debe tener al menos 8 caracteres, una mayúscula y un número'
    }

    // Validar repeatPassword
    if (!values.repeatPassword) {
        errors.repeatPassword = 'Debe repetir la contraseña'
    } else if (values.repeatPassword !== values.password) {
        errors.repeatPassword = 'Las contraseñas no coinciden'
    }

    return errors
}
