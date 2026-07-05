<script setup lang="ts">
import type { DIFFICULTY_NAMES, RATING_NAMES } from '../lib/types';

const props = defineProps<{
    difficulty: typeof DIFFICULTY_NAMES[number];
    stars: number;
    rate: typeof RATING_NAMES[number];
    moons: boolean;
    size: number;
}>();

const RATING_FILES = {
    'NA': '',
    'Rated': '',
    'Featured': '-featured',
    'Epic': '-epic',
    'Legendary': '-legendary',
    'Mythic': '-mythic'
}

const DIFFICULTY_FILES = {
    'NA': 'unrated',
    'Auto': 'auto',
    'Easy': 'easy',
    'Normal': 'normal',
    'Hard': 'hard',
    'Harder': 'harder',
    'Insane': 'insane',
    'EasyDemon': 'demon-easy',
    'MediumDemon': 'demon-medium',
    'HardDemon': 'demon-hard',
    'InsaneDemon': 'demon-insane',
    'ExtremeDemon': 'demon-extreme'
}

function getImagePath(difficulty: string, rating: string): string {
    const difficultyFile = DIFFICULTY_FILES[difficulty as keyof typeof DIFFICULTY_FILES] || 'unrated';
    const ratingFile = RATING_FILES[rating as keyof typeof RATING_FILES] || '';
    return `/difficulties/${difficultyFile}${ratingFile}.webp`;
}
</script>

<template>
    <div class="difficulty-face">
        <img :src="getImagePath(props.difficulty, props.rate)" :alt="`${props.difficulty} ${props.rate}`"
            :style="{ height: size + 'px' }" />
        <div v-if="props.stars > 0" class="stars">
            {{ props.stars }}
            <img :src="props.moons ? '/icons/moon.svg' : '/icons/star.svg'" alt="Star Icon"
                style="width: 1em; height: 1em; vertical-align: middle;" />
        </div>
    </div>
</template>

<style scoped>
.stars {
    font-size: 1.25em;
    line-height: 1;
    text-align: center;
}
</style>