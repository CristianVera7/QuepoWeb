<template lang="pug">
    .firstContainer
        .containerImageBackground
            Header
            .wrapperCardBody
                .cardBody
                    slot
</template>

<script setup lang="ts">
import Header from '../components/Header.vue'

</script>

<style scoped lang="scss">
.firstContainer {
    display: flex;
    flex-direction: column;
    // height: 70vh;
    // background-color: rgba(30, 255, 0, 0.062);
    background-color: rgba(30, 255, 0, 0.062);

    .containerImageBackground {
        background-image: url('../img/logo/forest.jpg');
        image-rendering: -webkit-optimize-contrast;
        background-size: cover;
        background-position: center;
        height: 50vh;

        .wrapperCardBody {
            display: flex;
            justify-content: center;
            align-items: center;





            .cardBody {
                width: 80%;
                box-shadow: 0px 5px 30px rgba(0, 0, 0, 1);
                background: rgba(1, 43, 0, 0.961);
                border-radius: 3rem;
            }
        }

    }

    .containerVacio {
        height: 100%;
        background-color: rgba(30, 255, 0, 0.062);
    }
}
</style>