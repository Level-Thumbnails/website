<script setup lang="ts">
import Header from "../components/Header.vue";
import Footer from "../components/Footer.vue";
import Container from "../components/Container.vue";
</script>

<template>
  <Header/>
  <Container class="not-found">
    <div class="level-playback">
      <div class="spike"></div>
      <div class="player"></div>
      <div class="ground"></div>

      <div class="particle-1"></div>
      <div class="particle-2"></div>
      <div class="particle-3"></div>
      <div class="particle-4"></div>
      <div class="particle-5"></div>

      <div class="death-message">
        <h1>You Died</h1>
        <p>We couldn't find the page you were looking for.</p>
        <p>
          Please check the URL or return to the
          <router-link to="/">homepage</router-link>
        </p>
      </div>
    </div>
  </Container>
  <Footer/>
</template>

<style scoped>
.not-found {
  text-align: center;
  padding: 50px;
}

.level-playback {
  --ground-height: 120px;
  --player-size: 40px;
}

.level-playback {
  position: relative;
  width: 100%;
  height: 480px;
  overflow: hidden;
  border: 2px solid #fff;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
  background-image: linear-gradient(
      to bottom,
      rgba(0, 0, 0, 0.8) 0%,
      rgba(0, 0, 0, 0.3) 100%
  );
  background-color: #402ef6;
}

.player {
  position: absolute;
  width: var(--player-size);
  height: var(--player-size);
  bottom: calc(var(--ground-height) - (var(--player-size) / 2));
  left: 180px;
  transform: translate(-50%, -50%);
  box-sizing: border-box;
  border: 8px solid #89ff0f;
  border-radius: 2px;
  outline: 2px solid black;
  animation: player-death 0.3s ease-in-out forwards;
  animation-delay: 1.5s;
}

.player:before {
  content: '';
  position: absolute;
  width: 50%;
  height: 50%;
  left: 25%;
  top: 25%;
  background-color: #1ffefc;
  border-radius: 1px;
  outline: 2px solid black;
}

.spike {
  position: absolute;
  border-left: 22px solid transparent;
  border-right: 22px solid transparent;
  border-bottom: 45px solid black;
  bottom: calc(var(--ground-height) - 4px);
  animation: spike-move 1.5s linear forwards;
}

.spike:before {
  content: '';
  position: absolute;
  left: -20px;
  bottom: -44px;
  border-left: 20px solid transparent;
  border-right: 20px solid transparent;
  border-bottom: 40px solid white;
}

.ground {
  position: absolute;
  width: 100%;
  height: calc(var(--ground-height) - 4px);
  box-sizing: border-box;
  bottom: 0;
  background-image: repeating-linear-gradient(
      to right,
      rgba(2, 12, 147, 0.8) 0,
      rgba(2, 12, 147, 0.8) 10px,
      rgba(255, 255, 255, 0.1) 10px,
      rgba(255, 255, 255, 0.12) 65px,
      rgba(255, 255, 255, 0.1) 120px
  );
  background-size: 120px 120px;
  background-color: #020c93;
  border-top: 10px solid #020c93;
  border-bottom: 10px solid #020c93;
  outline: 2px solid #fff;
  animation: ground-move 1.5s linear forwards;
}

.particle-1,
.particle-2,
.particle-3,
.particle-4,
.particle-5 {
  position: absolute;
  width: 5px;
  height: 10px;
  border-radius: 33%;
  background-color: #fff;
}

.death-message {
  position: absolute;
  top: 50%;
  left: 50%;
  opacity: 0;
  animation: death-message 0.25s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
  animation-delay: 2s;
  text-align: center;
  color: #fff;
  background-color: rgba(0, 0, 0, 0.7);
  padding: 48px 24px;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
  border: 8px solid white;
}

.death-message h1 {
  font-size: 2.5em;
  margin: 0;
}

.death-message p {
  margin: 10px 0;
}

.death-message a {
  color: #ffcc00;
  text-decoration: underline;
}

@keyframes spike-move {
  0% {
    left: 1000px;
  }
  100% {
    left: 180px;
  }
}

@keyframes ground-move {
  0% {
    background-position: 0 0;
  }
  100% {
    background-position: -820px 0;
  }
}

@keyframes player-death {
  0% {
    opacity: 1;
  }
  100% {
    opacity: 0;
    transform: translateY(50px) scale(0.5) rotate(45deg);
  }
}

@keyframes death-message {
  0% {
    opacity: 0;
    transform: translateX(-50%) translateY(-50%) scale(0.8);
  }
  100% {
    opacity: 1;
    transform: translateX(-50%) translateY(-50%) scale(1);
  }
}

.particle-1 {
  left: 180px;
  opacity: 0;
  bottom: calc(var(--ground-height) + 20px);
  animation: explode-1 0.5s ease-in-out forwards;
  animation-delay: 1.5s;
}

@keyframes explode-1 {
  0% {
    transform: translateX(0) translateY(0) scale(1);
    opacity: 1;
  }
  100% {
    transform: translateX(-50px) translateY(-50px) scale(0.5);
    opacity: 0;
  }
}

.particle-2 {
  left: 180px;
  bottom: calc(var(--ground-height) + 20px);
  opacity: 0;
  animation: explode-2 0.5s ease-in-out forwards;
  animation-delay: 1.5s;
}

@keyframes explode-2 {
  0% {
    transform: translateX(0) translateY(0) scale(1);
    opacity: 1;
  }
  100% {
    transform: translateX(-20px) translateY(-80px) scale(0.5);
    opacity: 0;
  }
}

.particle-3 {
  left: 180px;
  bottom: calc(var(--ground-height) + 20px);
  opacity: 0;
  animation: explode-3 0.5s ease-in-out forwards;
  animation-delay: 1.5s;
}

@keyframes explode-3 {
  0% {
    transform: translateX(0) translateY(0) scale(1);
    opacity: 1;
  }
  100% {
    transform: translateX(30px) translateY(-60px) scale(0.5);
    opacity: 0;
  }
}

.particle-4 {
  left: 180px;
  bottom: calc(var(--ground-height) + 20px);
  opacity: 0;
  animation: explode-4 0.5s ease-in-out forwards;
  animation-delay: 1.5s;
}

@keyframes explode-4 {
  0% {
    transform: translateX(0) translateY(0) scale(1);
    opacity: 1;
  }
  100% {
    transform: translateX(0px) translateY(-70px) scale(0.5);
    opacity: 0;
  }
}

.particle-5 {
  left: 180px;
  bottom: calc(var(--ground-height) + 20px);
  opacity: 0;
  animation: explode-5 0.5s ease-in-out forwards;
  animation-delay: 1.5s;
}

@keyframes explode-5 {
  0% {
    transform: translateX(0) translateY(0) scale(1);
    opacity: 1;
  }
  100% {
    transform: translateX(50px) translateY(-40px) scale(0.5);
    opacity: 0;
  }
}

@media (max-width: 768px) {
  .not-found {
    padding: 0;
    margin: 0;
    width: 100%;
    overflow: hidden;
  }

  .level-playback {
    transform: scale(0.8);
    left: calc(-15.5% * 0.8);
    width: calc(99% / 0.8);
    margin: 0 auto;
    height: calc(420px / 0.8);
  }

  .death-message {
    padding: 24px 16px;
    font-size: calc(1em / 0.8);
    width: 75%;
  }
}
</style>