const startButton = document.getElementById('startButton');
const stopButton = document.getElementById('stopButton');
const audio = document.getElementById('audio');
const cube = document.querySelector('.cube');

let audioContext, source, analyser, dataArray, animationId;
let angleX = 0;
let angleY = 0;
let velocityX = 0;
let velocityY = 0;
let fakeAngle = 0;
let cssSyncInterval;
let isPlaying = false;
let unlockMode = false;
let clickCount = 0;
let lastFakeAngle = 0;




const equalizer = document.getElementById('equalizer');
const bars = [];
const numBars = 16;

//Логіка equalizer-bar
for (let i = 0; i < numBars; i++) {
    const bar = document.createElement('div');
    bar.classList.add('equalizer-bar');
    equalizer.appendChild(bar);
    bars.push(bar);
}


// CSS-анімація для старту
window.addEventListener('DOMContentLoaded', () => {

    cube.classList.add('auto-rotate');
    unlockMode = localStorage.getItem("unlockMode") === "true";

    // Синхронізація кута з CSS
    cssSyncInterval = setInterval(() => {
        fakeAngle += 1.0;
        if (fakeAngle > 360) fakeAngle -= 360;
    }, 16); // ~60fps
});

function setupAudioAnalyser() {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    source = audioContext.createMediaElementSource(audio);
    analyser = audioContext.createAnalyser();

    source.connect(analyser);
    analyser.connect(audioContext.destination);

    analyser.fftSize = 256;
    const bufferLength = analyser.frequencyBinCount;
    dataArray = new Uint8Array(bufferLength);
}

function animateCube() {


    analyser.getByteFrequencyData(dataArray);

    // Аналіз гучності
    let sum = 0;
    for (let i = 0; i < dataArray.length; i++) {
        sum += dataArray[i];
    }
    const avg = sum / dataArray.length;

    // Гучність -> швидкість обертання
    const speed = avg / 10; // масштаб для кращої динаміки

    angleY += speed;
    angleX += speed * 0.5; // трохи повільніше по X



    cube.style.transform = `rotateX(${angleX}deg) rotateY(${angleY}deg)`;
    
    // Підсвітка рамки еквалайзера залежно від гучності
    const equalizerBox = document.getElementById('equalizer');
    const glowIntensity = Math.min(1, avg / 100); // обмежуємо від 0 до 1
    equalizerBox.style.boxShadow = `0 0 ${20 * glowIntensity}px ${glowIntensity * 10}px #00ff00`;


    animationId = requestAnimationFrame(animateCube);


    // Логіка індикатора та еквайзера
    const volumeBar = document.getElementById('volume-indicator');
    const barWidth = Math.min(300, avg * 3); // обмеження ширини
    volumeBar.style.width = `${barWidth}px`;
    
    for (let i = 0; i < numBars; i++) {
        const value = dataArray[i];
        const height = Math.max(4, value / 2); // мінімальна висота
        bars[i].style.height = `${height}px`;
    }
}


function startMusic() {
    if (unlockMode) {
        clickCount++;
        console.log(`Натискань: ${clickCount}/5`);

        // 🔔 Оновити індикатор
        const statusEl = document.getElementById('secret-status');
        if (statusEl) {
            
            const currentLang = localStorage.getItem("lang") || "uk";
            const dict = translations[currentLang];
            const message = dict.secretStatus.replace("{x}", clickCount);
            statusEl.textContent = message;
        }

        if (clickCount < 5) return;

        // ✅ Досягли 5 натискань — очищаємо індикатор
        unlockMode = false;
        clickCount = 0;
        localStorage.removeItem("unlockMode");
        if (statusEl) {
            statusEl.textContent = '';
        }

        console.log("5 натискань досягнуто — запускаємо куб");
    }

    if (isPlaying) return;
    isPlaying = true;

    if (!audioContext) {
        setupAudioAnalyser();
    }

    if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
    }

    cube.classList.remove('auto-rotate');
    clearInterval(cssSyncInterval);

    velocityX = 0;
    velocityY = 0;
    angleX = -30;
    angleY = lastFakeAngle;

    audio.play().then(() => {
        console.log('Музика почала відтворюватися');
        animateCube();
    }).catch(err => {
        console.error('Помилка відтворення музики:', err);
        isPlaying = false;
    });
}


function returnToCssRotation() {
    cancelAnimationFrame(animationId);
    cube.style.transform = 'rotateX(0deg) rotateY(0deg)';
    angleX = 0;
    angleY = 0;
    velocityX = 0;
    velocityY = 0;
    cube.classList.add('auto-rotate');

    cssSyncInterval = setInterval(() => {
        fakeAngle += 1.0;
        if (fakeAngle > 360) fakeAngle -= 360;

        // 🔄 зберігаємо актуальний кут
        lastFakeAngle = fakeAngle;
    }, 16);
}




function stopMusic() {
    if (!isPlaying) return;
    isPlaying = false;

    if (audio) {
        audio.pause();
        audio.currentTime = 0;
        console.log('Музика зупинена');
    }

    const volumeBar = document.getElementById('volume-indicator');
    if (volumeBar) {
        volumeBar.style.height = '20px';
        volumeBar.style.width = '10px';
    }

    if (typeof bars !== 'undefined' && bars.length > 0) {
        for (let bar of bars) {
            bar.style.height = '10px';
        }
    }

    returnToCssRotation();

    const equalizerBox = document.getElementById('equalizer');
    if (equalizerBox) {
        equalizerBox.style.boxShadow = 'none';
        equalizerBox.style.borderColor = '#00ff00';
    }

    if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
    }

    // 🔐 Активуємо режим "5 кліків"
    unlockMode = true;
    clickCount = 0;
    localStorage.setItem("unlockMode", "true");
    console.log("Режим 5 натискань активовано. Натисни 'Старт' 5 разів.");
}


audio.addEventListener('ended', () => {
    isPlaying = false;
    returnToCssRotation();

    const statusEl = document.getElementById('secret-status');
    if (statusEl) {
        
    }

    console.log("Музика завершилась — режим повернення активований");
});

function toggleDescription() {
    const panel = document.querySelector('.side-panel');
    const arrow = document.getElementById('arrow-icon');
    const isClosed = panel.classList.contains('closed');

    panel.classList.toggle('closed');
    arrow.textContent = isClosed ? '\u25C0' : '\u25B6';
}


const translations = {
    uk: {
      start: "Старт",
      stop: "Стоп",
      secretStatus: "🔓 Секретний режим: {x} з 5 натискань",
      cubePanel: `
     <h3 class="panel-title">🧊 Інформація про куба</h3>
     <p class="panel-intro"><strong>3D-куб</strong> — це інтерактивний візуальний елемент, який реагує на музику в реальному часі.</p>

     <h4 class="panel-title">🌀 Поведінка</h4>
    <ul class="panel-intro">
    <li>У спокійному режимі — автоматичне обертання (CSS).</li>
    <li>У режимі прослуховування — реагує на гучність аудіо.</li>
    <li>Обертання залежить від амплітуди: чим гучніше — тим швидше.</li>
    </ul>

     <h4 class="panel-title">🟩 Візуальні ефекти</h4>
    <ul class="panel-intro">
    <li>Куб має 3D-глибину та напівпрозорі межі з підсвічуванням.</li>
    </ul>

     <h4 class="panel-title">🔓 Секретний режим</h4>
    <ul class="panel-intro">
    <li>5 натискань на "Старт" відкривають прихований режим.</li>
    <li>Він активує нову анімацію та змінює логіку обертання.</li>
    </ul>

     <h4 class="panel-title">🔁 Синхронізація</h4>
    <ul class="panel-intro">
    <li>Куб обертається разом із еквалайзером та смужкою гучності.</li>
    <li>Створює цілісне музично-візуальне враження.</li>
    </ul>`

    },

    ru: {
      start: "Старт",
      stop: "Стоп",
      secretStatus: "🔓 Секретный режим: {x} из 5 нажатий",
      cubePanel: `
      <h3 class="panel-title">🧊 Информация о кубе</h3>
      <p class="panel-intro"><strong>3D-куб</strong> — это интерактивный визуальный элемент, который реагирует на музыку в реальном времени.</p>

      <h4 class="panel-title">🌀 Поведение</h4>
    <ul class="panel-intro">
    <li>В спокойном режиме — автоматическое вращение (CSS).</li>
    <li>В режиме прослушивания — реагирует на громкость аудио.</li>
    <li>Вращение зависит от амплитуды: чем громче — тем быстрее.</li>
    </ul>

     <h4 class="panel-title">🟩 Визуальные эффекты</h4>
    <ul class="panel-intro">
    <li>Куб имеет 3D-глубину и полупрозрачные грани с подсветкой.</li>
    </ul>

     <h4 class="panel-title">🔓 Секретный режим</h4>
    <ul class="panel-intro">
    <li>5 нажатий на "Старт" активируют скрытый режим.</li>
    <li>Он запускает новую анимацию и изменяет логику вращения.</li>
    </ul>

     <h4 class="panel-title">🔁 Синхронизация</h4>
    <ul class="panel-intro">
    <li>Куб вращается вместе с эквалайзером и индикатором громкости.</li>
    <li>Создаёт цельное музыкально-визуальное впечатление.</li>
    </ul>`
      
    },

    en: {
      start: "Start",
      stop: "Stop",
      secretStatus: "🔓 Secret mode: {x} of 5 presses",
      cubePanel: `
      <h3 class="panel-title">🧊 Cube Info</h3>
      <p class="panel-intro"><strong>The 3D cube</strong> is an interactive visual element that responds to music in real time.</p>

      <h4 class="panel-title">🌀 Behavior</h4>
    <ul class="panel-intro">
    <li>In idle mode — automatic rotation (CSS).</li>
    <li>In listening mode — reacts to audio volume.</li>
    <li>Rotation depends on amplitude: the louder — the faster.</li>
    </ul>

     <h4 class="panel-title">🟩 Visual Effects</h4>
    <ul class="panel-intro">
    <li>The cube has 3D depth and semi-transparent glowing edges.</li>
    </ul>

     <h4 class="panel-title">🔓 Secret Mode</h4>
    <ul class="panel-intro">
    <li>5 presses of "Start" activate a hidden mode.</li>
    <li>It launches a new animation and changes rotation behavior.</li>
    </ul>

     <h4 class="panel-title">🔁 Synchronization</h4>
    <ul class="panel-intro">
    <li>The cube rotates in sync with the equalizer and volume bar.</li>
    <li>Creates a unified musical and visual experience.</li>
    </ul>`

    }
  };

  function applyTranslation(lang) {
    const dict = translations[lang] || translations.uk;
  
    document.querySelectorAll("[data-i18n]").forEach(el => {
      const key = el.getAttribute("data-i18n");
      let text = dict[key] || key;
  
      if (key === "secretStatus") {
        if (unlockMode && clickCount > 0 && clickCount < 5) {
          text = text.replace("{x}", clickCount);
        } else {
          text = "";
        }
      }
      
  
      el.textContent = text;
    });
      
    document.querySelectorAll('[data-i18n-html]').forEach(el => {
        const key = el.getAttribute('data-i18n-html');
        const html = dict[key];
        if (html) el.innerHTML = html;
      });
      
  
    localStorage.setItem("lang", lang);
  }

  document.querySelectorAll('[data-lang]').forEach(btn => {
    btn.addEventListener('click', () => {
      const lang = btn.getAttribute('data-lang');
      applyTranslation(lang);
    });
  });  

  
  
// локалізація
const savedLang = localStorage.getItem('lang') || 'uk';
applyTranslation(savedLang);  



startButton.addEventListener('click', startMusic);
stopButton.addEventListener('click', stopMusic);