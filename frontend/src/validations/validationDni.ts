// validations/validationDni.ts

/**
 * Valida un DNI español (8 números + 1 letra)
 * @param dni - El DNI a validar
 * @returns Un objeto con el resultado de la validación y un mensaje de error si es inválido
 */
export const validateDni = (dni: string): { isValid: boolean; message?: string } => {
    // Eliminar espacios y convertir a mayúsculas
    const dniClean = dni.trim().toUpperCase();
    
    // Verificar si está vacío
    if (!dniClean) {
      return {
        isValid: false,
        message: 'El DNI no puede estar vacío'
      };
    }
    
    // Verificar que tenga 9 caracteres en total
    if (dniClean.length !== 9) {
      return {
        isValid: false,
        message: 'El DNI debe tener 8 números seguidos de una letra'
      };
    }
    
    // Verificar que los primeros 8 caracteres sean números
    const numberPart = dniClean.substring(0, 8);
    if (!/^\d{8}$/.test(numberPart)) {
      return {
        isValid: false,
        message: 'Los primeros 8 caracteres del DNI deben ser números'
      };
    }
    
    // Extraer la letra y verificar que sea una de las permitidas
    const validLetters = 'TRWAGMYFPDXBNJZSQVHLCKE';
    const dniLetter = dniClean.charAt(8);
    
    if (!validLetters.includes(dniLetter)) {
      return {
        isValid: false,
        message: `La letra ${dniLetter} no es válida para un DNI español. Las letras válidas son: ${validLetters}`
      };
    }
    
    // Extraer número y calcular letra correcta
    const dniNumber = parseInt(numberPart);
    const calculatedLetter = validLetters.charAt(dniNumber % 23);
    
    // Verificar si la letra es correcta
    if (calculatedLetter !== dniLetter) {
      return { 
        isValid: false, 
        message: `Este DNI no existe.` 
      };
    }
    
    return { isValid: true };
  };
  
  /**
   * Valida un NIE (Número de Identidad de Extranjero)
   * @param nie - El NIE a validar
   * @returns Un objeto con el resultado de la validación
   */
  export const validateNie = (nie: string): { isValid: boolean; message?: string } => {
    // Eliminar espacios y convertir a mayúsculas
    const nieClean = nie.trim().toUpperCase();
    
    // Verificar si está vacío
    if (!nieClean) {
      return {
        isValid: false,
        message: 'El NIE no puede estar vacío'
      };
    }
    
    // Verificar longitud
    if (nieClean.length !== 9) {
      return {
        isValid: false,
        message: 'El NIE debe tener 9 caracteres (X/Y/Z + 7 números + letra)'
      };
    }
    
    // Verificar que comience con X, Y o Z
    const firstChar = nieClean.charAt(0);
    if (firstChar !== 'X' && firstChar !== 'Y' && firstChar !== 'Z') {
      return {
        isValid: false,
        message: 'El NIE debe comenzar con X, Y o Z'
      };
    }
    
    // Verificar que los siguientes 7 caracteres sean números
    const numberPart = nieClean.substring(1, 8);
    if (!/^\d{7}$/.test(numberPart)) {
      return {
        isValid: false,
        message: 'Después de la letra inicial, el NIE debe tener 7 números'
      };
    }
    
    // Verificar que la letra sea una de las permitidas
    const validLetters = 'TRWAGMYFPDXBNJZSQVHLCKE';
    const nieLetter = nieClean.charAt(8);
    if (!validLetters.includes(nieLetter)) {
      return {
        isValid: false,
        message: `La letra ${nieLetter} no es válida para un NIE español. Las letras válidas son: ${validLetters}`
      };
    }
    
    // Convertir la primera letra a su equivalente numérico
    let firstDigit;
    if (firstChar === 'X') firstDigit = '0';
    else if (firstChar === 'Y') firstDigit = '1';
    else if (firstChar === 'Z') firstDigit = '2';
    
    // Calcular letra correcta
    const calculatedLetter = validLetters.charAt(parseInt(firstDigit + numberPart) % 23);
    
    // Verificar si la letra es correcta
    if (calculatedLetter !== nieLetter) {
      return { 
        isValid: false, 
        message: `Este NIE no existe.` 
      };
    }
    
    return { isValid: true };
  };
  
  /**
   * Valida un documento de identidad español (DNI o NIE)
   * @param document - El documento a validar
   * @returns Un objeto con el resultado de la validación
   */
  export const validateSpanishId = (document: string): { isValid: boolean; message?: string } => {
    if (!document || document.trim() === '') {
      return {
        isValid: false,
        message: 'El campo de documento no puede estar vacío'
      };
    }
    
    const documentClean = document.trim().toUpperCase();
    
    // Determinar si es un DNI o NIE y validar según corresponda
    if (/^[XYZ]/.test(documentClean)) {
      return validateNie(documentClean);
    } else {
      return validateDni(documentClean);
    }
  };