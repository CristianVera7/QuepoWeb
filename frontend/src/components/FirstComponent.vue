<template lang="pug">
    // Contenedor principal del layout
    .firstContainer
        // Contenedor para imagen de fondo y contenido superior
        .containerImageBackground
            // Componente de cabecera 
            Header
            // Contenedor del cuerpo principal de la tarjeta
            .wrapperCardBody
                .cardBody
                    // Slot para insertar contenido dinámico desde el componente padre
                    slot
</template>


<script setup lang="ts">
import Header from '../components/Header.vue'

</script>