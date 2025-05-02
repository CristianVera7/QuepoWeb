<template lang="pug">
    Header
    .wrapperEditProfile
        h2 Editar perfil
        
        form.formEditProfile()
            input(type="text" placeholder="nickName" v-model="user.nickName" style="border:none" readonly required disabled )
            input(type="email" placeholder="Email" v-model="user.email" style="border:none" readonly required disabled)
            input(type="text" placeholder="DNI" v-model="user.dni" unique)

            button(type="button" class="toggle-password-btn" @click="showPasswordForm = !showPasswordForm") 
                | {{ showPasswordForm ? 'Ocultar formulario de contraseña' : 'Cambiar contraseña' }}
            Transition(name="fade-slide")
                .formPassword(v-if="showPasswordForm")
                    h3 Cambiar contraseña
                    input(type="password" placeholder="Contraseña actual" v-model="user.password")
                    input(type="password" placeholder="Nueva contraseña" v-model="user.newPassword")
                    input(type="password" placeholder="Repetir nueva contraseña" v-model="repeatNewPassword")
                
            .btn-group
                button.submit( @click.prevent="updateUserData") Actualizar perfil
                button.delete(@click="confirmDeleteAccount") Eliminar cuenta
</template>

<script setup lang="ts">
import Header from '../components/Header.vue';
import { onMounted, ref, watch } from 'vue';
import { useRegisterStore } from '../stores/registerStore'
import { useRouter } from 'vue-router';
import axios from 'axios';


const router = useRouter();
const { tokenStore } = useRegisterStore()
const showPasswordForm = ref(false);
const user = ref({
    nickName: '',
    email: '',
    dni: '',
    password: '',
    newPassword: ''
});
const repeatNewPassword = ref('');

const getUserData = async () => {
    try {
        const response = await axios.get('http://localhost:8000/user/get', {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${tokenStore}`
            }
        });
        user.value = response.data.data;
    } catch (error) {
        console.error(error);
        alert('Error al obtener los datos del perfil');
    }
};

const updateUserData = async () => {
    try {
        if (user.value.password) {
            if (!user.value.newPassword || !repeatNewPassword) {
                alert('Por favor, complete todos los campos de contraseña');
                return;
            }
            if (user.value.newPassword !== repeatNewPassword.value) {
                alert('Las contraseñas no coinciden');
                return;
            }
        }
        const response = await axios.put('http://localhost:8000/user/update', user.value, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${tokenStore}`
            }
        });
        console.log(response.data);
        alert('Perfil actualizado correctamente');
    } catch (error) {
        console.error(error);
        alert('Error al actualizar el perfil');
    }
};

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

            h3 {
                margin: 0 0 0.5rem;
                color: #34495e;
                font-size: 1.2rem;
            }

            input {
                color: #2e7d32;
                background-color: #e0f0e9;
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
        }
        // input::placeholder {
        //     color: #2e7d32;
        // }

        .btn-group {
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
            }

            .submit {
                background-color: #2d89ef;
                color: white;

                &:hover {
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
</style>