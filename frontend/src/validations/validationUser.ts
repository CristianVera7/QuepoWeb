// Interfaz que define los campos del formulario de registro
interface FormValues {
    nickName: string
    email: string
    password: string
    repeatPassword: string
}

// Interfaz que define la estructura de los errores posibles en el formulario
interface ValidationErrors {
    nickName?: string
    email?: string
    password?: string
    repeatPassword?: string
}

// Función principal de validación del formulario de registro
export function validateForm(values: FormValues): ValidationErrors {
    const errors: ValidationErrors = {}

    // Validar el campo nickName
    // Se verifica que no esté vacío y que tenga al menos 4 caracteres
    if (!values.nickName.trim()) {
        errors.nickName = 'El campo nickName no puede ir en blanco'
    } else if (values.nickName.trim().length < 4) {
        errors.nickName = ' Debe contener al menos 4 caracteres'
    }

    // Validar el campo email
    // Se valida que no esté vacío y que coincida con el formato de un correo electrónico
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!values.email.trim()) {
        errors.email = 'El email es obligatorio'
    } else if (!emailRegex.test(values.email)) {
        errors.email = 'El email no es válido. Ej: nickName@gmail.com'
    }

    // Validar el campo password
    // Debe contener al menos 8 caracteres, una mayúscula y un número
    const passwordRegex = /^(?=.*[A-Z])(?=.*\d).{8,}$/
    if (!values.password) {
        errors.password = 'La contraseña es obligatoria'
    } else if (!passwordRegex.test(values.password)) {
        errors.password = 'La contraseña debe tener al menos 8 caracteres, una mayúscula y un número'
    }

    // Validar el campo repeatPassword
    // Debe completarse y coincidir con la contraseña original
    if (!values.repeatPassword) {
        errors.repeatPassword = 'Debe repetir la contraseña'
    } else if (values.repeatPassword !== values.password) {
        errors.repeatPassword = 'Las contraseñas no coinciden'
    }

    // Retornar el objeto con los errores encontrados (si hay)
    return errors
}
