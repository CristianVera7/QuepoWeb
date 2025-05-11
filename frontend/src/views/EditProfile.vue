<template lang="pug">
    FirstComponent
        PlanFiltersMenu(:hasDni="hasDni")
        .wrapperEditProfile
            form.formEditProfile()
                input(type="text" placeholder="nickName" v-model="user.nickName" style="border:none" readonly required disabled)
                input(type="email" placeholder="Email" v-model="user.email" style="border:none" readonly required disabled)
                
                .input-group
                    input(type="text" placeholder="DNI/NIE" v-model="user.dni" @input="validateDniField" 
                          :class="{ 'error': dniError }" maxlength="9")
                    p.msgError(v-if="dniError") {{ dniError }}

                button(type="button" class="toggle-password-btn" @click="showPasswordForm = !showPasswordForm") 
                    | {{ showPasswordForm ? 'Ocultar formulario de contraseña' : 'Cambiar contraseña' }}
                Transition(name="fade-slide")
                    .formPassword(v-if="showPasswordForm")
                        h3 Cambiar contraseña

                        .input-group
                            input(type="password" placeholder="Contraseña actual" v-model="user.password")
                            p.msgError(v-if="passwordErrors.password") {{ passwordErrors.password }}

                        .input-group
                            input(type="password" placeholder="Nueva contraseña" v-model="user.newPassword")
                            p.msgError(v-if="passwordErrors.newPassword") {{ passwordErrors.newPassword }}

                        .input-group
                            input(type="password" placeholder="Repetir nueva contraseña" v-model="repeatNewPassword")
                            p.msgError(v-if="passwordErrors.repeatNewPassword") {{ passwordErrors.repeatNewPassword }}

                .btns-group
                    button.submit(@click.prevent="updateUserData" :disabled="isBtnDisabled") Actualizar perfil
                    button.delete(@click.prevent="confirmDeleteAccount") Eliminar cuenta

        .success-modal(v-if="showSuccessModal")
            .modal-content
                i.fas.fa-check-circle
                h3 Perfil actualizado con éxito!
                p {{ successMessage }}
                button.modal-button(@click="navigateToDashboard") Ver mis planes

        .error-modal(v-if="showErrorModal")
            .modal-content
                i.fas.fa-times-circle
                h3 Error al actualizar perfil
                p {{ errorMessage }}
                button.modal-button(@click="showErrorModal = false") Cerrar
                
        .delete-modal(v-if="showDeleteModal",@click.self="showDeleteModal = false")
            .modal-content
                h3 ¿Estás seguro de que deseas eliminar tu cuenta?
                p Esta acción no se puede deshacer. Por favor, introduce tu contraseña para confirmar.

                .input-group
                    input(type="password" placeholder="Contraseña" v-model="deletePassword")
                    p.msgError(v-if="deleteError") {{ deleteError }}

                .btns-group
                    button.confirm-delete(@click.prevent="performDeleteAccount") Eliminar
                    button.cancel-delete(@click.prevent="cancelDeleteAccount") Cancelar
</template>

<script setup lang="ts">
import FirstComponent from '../components/FirstComponent.vue';
import PlanFiltersMenu from '../components/PlanFiltersMenu.vue';
import { onMounted, ref, watch } from 'vue';
import { useRegisterStore } from '../stores/registerStore';
import { useRouter } from 'vue-router';
import axios from 'axios';
import { storeToRefs } from 'pinia';
import { validatePasswordChange } from '../validations/validationEditProfile';
import { validateSpanishId } from '../validations/validationDni';

const { hasDni } = storeToRefs(useRegisterStore())
const router = useRouter();
const { tokenStore, cleanStorage, cleanStore } = useRegisterStore()
const showPasswordForm = ref(false);
const showSuccessModal = ref(false);
const showErrorModal = ref(false);
const showDeleteModal = ref(false);
const deletePassword = ref('');
const deleteError = ref('');
const successMessage = ref('');
const errorMessage = ref('');
const passwordErrors = ref<Record<string, string>>({});
const dniError = ref<string>('');
const isBtnDisabled = ref(false);
const originalDni = ref('');
const user = ref({
    nickName: '',
    email: '',
    dni: '',
    password: '',
    newPassword: ''
});
const repeatNewPassword = ref('');

// Obtener los datos del usuario
const getUserData = async () => {
    try {
        const response = await axios.get('http://localhost:8000/user/get', {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${tokenStore}`
            }
        });
        user.value = response.data.data;
        // Guardar el DNI original para comparar si ha cambiado
        originalDni.value = response.data.data.dni || '';
    } catch (error) {
        console.error(error);
        errorMessage.value = 'Error al obtener los datos del perfil';
        showErrorModal.value = true;
    }
};

// Validar el campo DNI
const validateDniField = () => {
    // Si el DNI no ha cambiado, no validamos
    if (user.value.dni === originalDni.value) {
        dniError.value = '';
        return;
    }

    // Solo validamos si hay contenido
    if (user.value.dni && user.value.dni.trim() !== '') {
        // Si el campo tiene contenido pero no está completo, mostramos mensaje de ayuda
        if (user.value.dni.trim().length < 9) {
            dniError.value = 'Introduzca un DNI (8 números + letra) o NIE (X/Y/Z + 7 números + letra)';
            checkFormValidity();
            return;
        }

        const validation = validateSpanishId(user.value.dni);
        dniError.value = validation.isValid ? '' : validation.message || 'DNI/NIE no válido';
    } else {
        dniError.value = '';
    }

    checkFormValidity();
};

// Verificar si el formulario es válido
const checkFormValidity = () => {
    const passwordFieldsValid = !showPasswordForm.value || Object.keys(passwordErrors.value).length === 0;
    const dniFieldValid = !dniError.value;

    isBtnDisabled.value = !(passwordFieldsValid && dniFieldValid);
};

// Actualizar los datos del usuario
const updateUserData = async () => {
    try {
        // Verificar contraseña si se está cambiando
        if (user.value.password) {
            if (!user.value.newPassword || !repeatNewPassword.value) {
                errorMessage.value = 'Por favor, complete todos los campos de contraseña';
                showErrorModal.value = true;
                return;
            }
            if (user.value.newPassword !== repeatNewPassword.value) {
                errorMessage.value = 'Las contraseñas no coinciden';
                showErrorModal.value = true;
                return;
            }
        }

        // Verificar DNI si ha cambiado
        if (user.value.dni !== originalDni.value) {
            const dniValidation = validateSpanishId(user.value.dni);
            if (!dniValidation.isValid) {
                errorMessage.value = dniValidation.message || 'DNI/NIE no válido';
                showErrorModal.value = true;
                return;
            }
        }

        const response = await axios.put('http://localhost:8000/user/update', user.value, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${tokenStore}`
            }
        });

        // Actualizar el DNI original después de una actualización exitosa
        originalDni.value = user.value.dni;

        // Mostrar mensaje de éxito
        successMessage.value = 'Tu perfil ha sido actualizado correctamente.';
        showSuccessModal.value = true;
    } catch (error: unknown) {
        if (axios.isAxiosError(error)) {
            errorMessage.value = error.response?.data?.message || 'Error desconocido';
        } else {
            errorMessage.value = 'Ha ocurrido un error desconocido.';
        }
        showErrorModal.value = true;
    }
};

const navigateToDashboard = () => {
    router.push('/dashboard');
};

const confirmDeleteAccount = () => {
    showDeleteModal.value = true;
    deletePassword.value = '';
    deleteError.value = '';
};

const cancelDeleteAccount = () => {
    showDeleteModal.value = false;
    deletePassword.value = '';
    deleteError.value = '';
};

const performDeleteAccount = async () => {
    if (!deletePassword.value) {
        deleteError.value = 'Por favor, introduce tu contraseña';
        return;
    }

    try {
        await axios.delete('http://localhost:8000/user/delete', {
            data: { password: deletePassword.value },
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${tokenStore}`
            }
        });

        // Cerrar sesión o redirigir
        successMessage.value = 'Tu cuenta ha sido eliminada con éxito.';
        showDeleteModal.value = false;

        cleanStorage()
        cleanStore()
        router.push('/register');

    } catch (error: unknown) {
        if (axios.isAxiosError(error)) {
            deleteError.value = error.response?.data?.message || 'Error al eliminar cuenta';
        } else {
            deleteError.value = 'Ha ocurrido un error inesperado.';
        }
    }
};

watch([() => user.value.password, () => user.value.newPassword, repeatNewPassword], () => {
    if (showPasswordForm.value) {
        passwordErrors.value = validatePasswordChange({
            password: user.value.password,
            newPassword: user.value.newPassword,
            repeatNewPassword: repeatNewPassword.value,
        });

        checkFormValidity();
    } else {
        passwordErrors.value = {};
        checkFormValidity();
    }
});

// Agregar observador para el campo DNI
watch(() => user.value.dni, () => {
    validateDniField();
});

onMounted(async () => {
    await getUserData();
});
</script>

<style lang="scss" scoped>
.wrapperEditProfile {
    max-width: 700px;
    margin: 2rem auto;
    padding: 2rem;
    background-color: #fdfdfd;
    border-radius: 12px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);

    h2 {
        text-align: center;
        margin-bottom: 1.5rem;
        font-size: 1.8rem;
        color: #2c3e50;
    }

    form.formEditProfile {
        display: flex;
        flex-direction: column;
        gap: 1.2rem;

        .input-group {
            display: flex;
            flex-direction: column;
            gap: 0.3rem;

            .msgError {
                color: #e74c3c;
                font-size: 0.85rem;
                padding-left: 0.3rem;
                margin-top: 0.2rem;
                font-weight: 500;
            }
        }

        .toggle-password-btn {
            background-color: transparent;
            border: none;
            color: #2d89ef;
            font-weight: 600;
            cursor: pointer;
            align-self: flex-start;
            padding: 0.5rem 0;
            transition: color 0.3s ease;

            &:hover {
                color: #2269be;
            }
        }

        .formPassword {
            background-color: #f9f9f9;
            padding: 1rem 1.2rem;
            border: 1px solid #e0e0e0;
            border-radius: 10px;
            display: flex;
            flex-direction: column;
            gap: 0.8rem;

            .input-group {
                display: flex;
                flex-direction: column;
                gap: 0.3rem;

                h3 {
                    margin: 0 0 0.5rem;
                    color: #34495e;
                    font-size: 1.2rem;
                }

                input {
                    padding: 0.75rem 1rem;
                    border-radius: 8px;
                    font-size: 1rem;
                    border: 1px solid #2e7d32;
                    background-color: #e0f0e9;
                    color: #2e7d32;

                    &:focus {
                        border-color: #3498db;
                        outline: none;
                    }
                }

                .msgError {
                    color: #e74c3c;
                    font-size: 0.85rem;
                    padding-left: 0.3rem;
                    margin-top: -0.2rem;
                    font-weight: 500;
                }
            }
        }

        .fade-slide-enter-active,
        .fade-slide-leave-active {
            transition: opacity 0.4s ease, transform 0.4s ease;
        }

        .fade-slide-enter-from,
        .fade-slide-leave-to {
            opacity: 0;
            transform: translateY(-10px);
        }

        input {
            padding: 0.75rem 1rem;
            border: 1px solid #2e7d32;
            border-radius: 8px;
            font-size: 1rem;
            transition: border 0.2s ease;
            color: #2e7d32;
            background-color: #e0f0e9;

            &:focus {
                border-color: #3498db;
                outline: none;
            }

            &.error {
                border-color: #e74c3c;
            }
        }

        .btns-group {
            display: flex;
            justify-content: space-between;
            gap: 1rem;
            margin-top: 1.5rem;

            button {
                padding: 0.75rem 1.2rem;
                font-size: 1rem;
                border: none;
                border-radius: 8px;
                cursor: pointer;

                &:disabled {
                    background-color: #ccc;
                    cursor: not-allowed;
                }
            }

            .submit {
                background-color: #2d89ef;
                color: white;

                &:hover:not(:disabled) {
                    background-color: #2269be;
                }
            }

            .delete {
                background-color: #e74c3c;
                color: white;

                &:hover {
                    background-color: #c0392b;
                }
            }
        }
    }
}

.success-modal {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.7);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
    animation: fadeIn 0.3s ease-out;

    .modal-content {
        background-color: #022c05;
        border-radius: 12px;
        padding: 2.5rem;
        text-align: center;
        max-width: 500px;
        width: 90%;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
        border: 1px solid rgba(255, 255, 255, 0.2);

        i {
            font-size: 4rem;
            color: #4CAF50;
            margin-bottom: 1.5rem;
        }

        h3 {
            font-size: 1.8rem;
            margin-bottom: 1rem;
            color: #ffffff;
        }

        p {
            margin-bottom: 2rem;
            color: rgba(255, 255, 255, 0.8);
            line-height: 1.5;
        }

        .modal-button {
            background-color: #4CAF50;
            color: white;
            border: none;
            padding: 1rem 2rem;
            border-radius: 8px;
            font-size: 1.1rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            box-shadow: 0 4px 15px rgba(0, 179, 0, 0.3);

            &:hover {
                background-color: #43a047;
                box-shadow: 0 6px 15px rgba(76, 175, 80, 0.4);
            }
        }
    }
}

.error-modal {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.7);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
    animation: fadeIn 0.3s ease-out;

    .modal-content {
        background-color: #e74c3c;
        border-radius: 12px;
        padding: 2.5rem;
        text-align: center;
        max-width: 500px;
        width: 90%;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
        border: 1px solid rgba(255, 255, 255, 0.2);

        i {
            font-size: 4rem;
            color: #fff;
            margin-bottom: 1.5rem;
        }

        h3 {
            font-size: 1.8rem;
            margin-bottom: 1rem;
            color: #ffffff;
        }

        p {
            margin-bottom: 2rem;
            color: rgba(255, 255, 255, 0.8);
            line-height: 1.5;
        }

        .modal-button {
            background-color: #ff4d4d;
            color: white;
            border: none;
            padding: 1rem 2rem;
            border-radius: 8px;
            font-size: 1.1rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            box-shadow: 0 4px 15px rgba(255, 0, 0, 0.3);

            &:hover {
                background-color: #e74c3c;
                box-shadow: 0 6px 15px rgba(231, 76, 60, 0.4);
            }
        }
    }
}

.delete-modal {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.459);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
    animation: fadeIn 0.3s ease-out;

    .modal-content {
        background-color: #001d06f5;
        border-radius: 12px;
        padding: 2.5rem;
        text-align: center;
        max-width: 500px;
        width: 90%;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
        border: 1px solid rgba(0, 0, 0, 0.1);

        h3 {
            font-size: 1.8rem;
            margin-bottom: 1rem;
            color: white;
        }

        p {
            margin-bottom: 1.5rem;
            color: #b4b4b4;
            line-height: 1.5;
        }

        .input-group {
            margin: 1.5rem 0;

            input {
                width: 100%;
                padding: 0.75rem 1rem;
                border-radius: 8px;
                border: 1px solid green;
                background-color: rgba(156, 241, 156, 0.267);
                font-size: 1rem;
                color: white;

                &:focus {
                    border-color: #00e93a;
                    outline: none;
                }
            }

            .msgError {
                color: #e74c3c;
                text-align: left;
                margin-top: 0.5rem;
                font-size: 0.9rem;
            }
        }

        .btns-group {
            display: flex;
            justify-content: space-between;
            gap: 1rem;
            margin-top: 1.5rem;

            button {
                flex: 1;
                padding: 0.75rem 1.5rem;
                border-radius: 8px;
                font-size: 1rem;
                cursor: pointer;
                border: none;
                font-weight: 600;
                transition: all 0.3s ease;
            }

            .confirm-delete {
                background-color: #F44336;
                color: white;

                &:hover {
                    background-color: #e53935;
                }
            }

            .cancel-delete {
                background-color: #e9ecef;
                color: #495057;

                &:hover {
                    background-color: #dee2e6;
                }
            }
        }
    }
}

@keyframes fadeIn {
    from {
        opacity: 0;
    }

    to {
        opacity: 1;
    }
}
</style>