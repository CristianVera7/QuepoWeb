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