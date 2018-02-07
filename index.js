const config = {
  initialScreen: 'splash',
  runtime: {
    updateInterval: 0
  },
  splashScreen: {
    menuItems: [
      {
        label: 'PLAY',
        behavior: 'playGame'
      },
      {
        label: 'SCORE',
        behavior: 'showScore'
      },
      {
        label: 'CREDITS',
        behavior: 'showCredits'
      }
    ]
  },
  levelWin: {
    labelTag: 'YOU_WIN',
    menuItems: [
      {
        label: 'NEXT_LEVEL',
        behavior: 'nextLevel'
      },
      {
        label: 'PLAY_AGAIN',
        behavior: 'playAgain'
      },
      {
        label: 'MAIN_MENU',
        behavior: 'mainMenu'
      }
    ]
  },
  levelLose: {
    labelTag: 'DEATH',
    menuItems: [
      {
        label: 'PLAY_AGAIN',
        behavior: 'playAgain'
      },
      {
        label: 'MAIN_MENU',
        behavior: 'mainMenu'
      }
    ]
  },
  level: {
    width: 16,
    height: 12,
    numDots: 2,
    dotPercentage: 0.08,
    widthIncrease: 4,
    heightIncrease: 3,
    numDotsIncrease: 5,
    dotPercentageIncrease: 0.03,
    dotPercentageMax: 0.5,
    startingPosition: {x: 14, y: 10}
  },
  snake: {
    initialSize: 3,
    movementInterval: 150000000,
    safeZone: 3,
    modifiers: ['snake1', 'snake2', 'snake3']
  },
  dots: {
    modifiers: ['size1', 'size2', 'size3']
  }
}

const i18nText = {
  en: {
    PLAY: 'Play the game!',
    SCORE: 'Highest scores (so far)',
    OPTIONS: 'See all the options...',
    CREDITS: 'Why who what now?',
    READY: 'Ready?',
    YOU_WIN: 'So good!',
    DEATH: 'You\'ve accomplished death.',
    NEXT_LEVEL: 'Next level!',
    PLAY_AGAIN: 'Play this level once again',
    MAIN_MENU: 'Main Menu',
    CREDITS_DESCRIPTION: 'The challedge? No build system of any kind, client-side only, no IDE, no outside libraries in any form.  ...Challenge accepted.',
    OKAY: 'Totes.',
    HIGHEST_LEVEL: 'Highest Level',
    MOVEMENT_SPEED: 'Movement Speed',
    NUMBER_OF_DOTS: 'Number of Dots',
    SCREEN_SIZE: 'Screen Size',
    PERSONAL_BEST: 'My Personal Best',
    DOT_PERCENTAGE: 'Dot Percentage'
  }
}

function t(id) {
  return i18nText['en'][id] || id;
}

function applyEmitter(target) {
  const listeners = {};

  target.on = function(name, fn) {
    if (!listeners[name]) {
      listeners[name] = [];
    }
    listeners[name].push(fn);
  }

  target.off = function(name, fn) {
    const group = listeners[name];
    if (group) {
      const index = group.indexOf(fn);
      if (index !== -1) {
        group.splice(index, 1);
        if (group.length === 0) {
          delete listeners[name];
        }
      }
    }
  }

  target.once = (name, fn) => {
    const wrappedFn = function () {
      const args = Array.prototype.slice.call(arguments);
      target.off(name, wrappedFn);
      fn.apply(target, args);
    };
    target.on(name, wrappedFn);
  };

  target.emit = function (name) {
    const args = Array.prototype.slice.call(arguments, 1);
    console.log(name, args, this);

    if (listeners[name]) {
      // prevent listeners from changing the game
      Object.freeze(args);
      listeners[name].forEach(fn => fn.apply(target, args));
    }
  }
}

/* static */
const StatKeeper = (function () {
  const key = 'snake';

  function get() {
    var stats;
    try {
      stats = JSON.parse(atob(window.localStorage.getItem(key)));
    } catch (ex) {
      console.warn('unable to load old stats from localStorage, assuming new player');
      stats = {};
    }
    return stats;
  }

  function save(latest) {
    try {
      window.localStorage.setItem(key, btoa(JSON.stringify(latest)));
    } catch (ex) {
      console.warn('unable to write to localStorage');
    }
  }

  function updateMax(dest, source) {
    var updatedKeys = [];
    const keys = Object.keys(source);


    for(var i = 0; i < keys.length; i++) {
      const key = keys[i];
      if (!dest[key] || source[key] > dest[key]) {
        dest[key] = source[key];
        updatedKeys.push(key);
      }
    }

    return updatedKeys;
  }

  function saveHighest(latest) {
    const known = get();
    var updatedKeys = updateMax(known, latest);

    if (updatedKeys.length) {
      save(known);
    }

    return updatedKeys;
  }

  return {
    get,
    saveHighest
  }
}())

function createEl(className, tagName) {
  const div = document.createElement(tagName || 'div');
  div.classList.add(className);
  return div;
}

function createTextEl(className, labelTag) {
  const textEl = createEl('label', 'span');
  textEl.classList.add(className);
  textEl.appendChild(document.createTextNode(t(labelTag)));
  return textEl;
}

function createMenuEl(items, {onFocus, onClick}) {
  const el = createEl('menu');

  for (var i = 0; i < items.length; i++) {
    const item = items[i];
    const itemEl = createEl('menu__item');
    itemEl.setAttribute('tabindex', '0');
    itemEl.addEventListener('focus', onFocus.bind(null, i));
    itemEl.addEventListener('click', onClick.bind(null, i));
    itemEl.appendChild(createTextEl('menu__item-text', item.label));
    el.appendChild(itemEl);
  }

  return el;
}

function createPrimaryButton(className, {labelTag, onClick}) {
  const el = createEl('button');
  el.classList.add(className);
  el.setAttribute('tabindex', '0');
  el.addEventListener('click', onClick);
  const textEl = createEl('button__label', 'span');
  textEl.appendChild(document.createTextNode(t(labelTag)));
  el.appendChild(textEl);
  return el;
}

function createOverlayEl() {
  const el = createEl('overlay');
  const watermarkEl = createEl('overlay__watermark');

  el.appendChild(watermarkEl);

  return el;
}

function createGrid(w, h) {
  var i, grid = [];

  for (i = 0; i < w; i++) {
    grid[i] = new Array(h);
  }

  return grid;
}

function findFreeSquare(grid) {
  var x = Math.floor(Math.random() * grid.length);
  var y = Math.floor(Math.random() * grid[x].length);
  var square = grid[x][y];
  while (square) {
    x = Math.floor(Math.random() * grid.length);
    y = Math.floor(Math.random() * grid[x].length);
    square = grid[x][y];
  }
  return {x, y};
}

function Menu(items, containerEl) {
  applyEmitter(this);
  const onFocus = i => cursor = i;
  const onClick = () => this.emit('click');
  const el = createMenuEl(items, {onFocus, onClick});
  var cursor = 0;


  function focusCursor() {
    const targetEl = el.querySelectorAll('.menu__item')[cursor];
    targetEl.focus();
  }

  this.selectNext = function () {
    if (cursor < items.length - 1) {
      cursor++;
    } else {
      cursor = 0;
    }
    focusCursor();
  }

  this.selectPrev = function () {
    if (cursor > 0) {
      cursor--;
    } else {
      cursor = items.length - 1;
    }
    focusCursor();
  }

  this.getSelectedItem = () => {
    return items[cursor];
  }

  containerEl.appendChild(el);
}

function Overlay(containerEl) {
  applyEmitter(this);
  const el = createOverlayEl();
  const onStart = e => {
    el.style.zIndex = 9;
    this.emit('start', e);
  }
  const onEnd = e => {
    el.style.zIndex = 0;
    this.emit('end', e);
  }
  el.addEventListener('transitionend', onEnd);

  function reset() {
    for (var i = 0; i < el.classList.length; i++) {
      const className = el.classList[i];
      if (className !== 'overlay') {
        el.classList.remove(className);
      }
    }
  }

  const fades = {
    black: () => {
      reset();
      el.classList.add('overlay--black');
      onStart();
    },
    none: () => {
      reset();
      onStart();
    }
  };

  this.fade = (fadeType, cb) => {
    this.once('end', cb);
    if (fades[fadeType]) {
      fades[fadeType]();
    }
  }

  containerEl.appendChild(el);
}

function OverlayText(containerEl, labelTag) {
  applyEmitter(this);
  const el = createEl('overlay-text');
  el.appendChild(createTextEl('overlay-text__text', labelTag));
  el.classList.add('overlay-text--entering');
  const onLeft = e => {
    this.destroy();
    this.emit('left', e);
  }
  var entering = false;

  this.update = () => {
    if (!entering) {
      entering = true;
      el.classList.remove('overlay-text--entering');
    }
  }

  this.end = () => {
    el.addEventListener('transitionend', onLeft);
    el.classList.add('overlay-text--leaving');
  }

  this.destroy = () => {
    containerEl.removeChild(el);
  }

  containerEl.appendChild(el);
}

function OverlayTextMenu(containerEl, config) {
  applyEmitter(this);
  const el = createEl('level-win-overlay');
  const overlayText = new OverlayText(el, config.labelTag);
  const menu = new Menu(config.menuItems, el);
  const handleNextItem = () => menu.selectNext();
  const handlePrevItem = () => menu.selectPrev();
  const handleSelection = () => this.emit('end', {to: menu.getSelectedItem().behavior});
  const keyboardCodes = {
    'KeyS': handleNextItem,
    'ArrowDown': handleNextItem,
    'KeyD': handleNextItem,
    'ArrowRight': handleNextItem,
    'KeyW': handlePrevItem,
    'ArrowUp': handlePrevItem,
    'KeyA': handlePrevItem,
    'ArrowLeft': handlePrevItem,
    'Space': handleSelection,
    'Enter': handleSelection,
  }
  menu.on('click', handleSelection);

  const screen = new Screen(keyboardCodes);
  this.bindWindow = screen.bindWindow;
  this.releaseWindow = screen.releaseWindow;
  this.update = passed => overlayText.update(passed);
  this.destroy = () => {
    containerEl.removeChild(el);
    screen.destroy();
  }

  containerEl.appendChild(el);
}

function DotFactory(containerEl) {
  const dotModifiers = config.dots.modifiers;
  const list = [];
  const freeList = [];

  function Dot() {
    const el = createEl('dot');
    var x, y;

    function reset() {
      x = -1;
      y = -1;
      el.style.transform = '';
      el.style.opacity = 1;
      for (var i = 0; i < el.classList.length; i++) {
        const name = el.classList[i];
        el.classList.remove(name);
      }
      el.classList.add('dot');
    }

    function destroy() {
      const index = list.indexOf(this);
      if (index > -1) {
        list.splice(index, 1);
        reset();
        el.style.opacity = 0;
        freeList.push(this);
      }
    }

    this.destroy = destroy;
    this.reset = reset;
    this.getPosition = () => ({x, y});
    this.setPosition = (xp, yp) => {
      x = xp;
      y = yp;
    }
    this.getEl = () => el;
    this.addModifier = name => el.classList.add('dot--' + name);

    reset();
    containerEl.appendChild(el);
  }

  function addModifierToDot(dot) {
    const n = Math.floor(Math.random() * dotModifiers.length);
    dot.addModifier(dotModifiers[n]);
  }

  this.createDot = () => {
    let dot;
    if (freeList.length) {
      dot = freeList.pop();
      dot.reset();
    } else {
      dot = new Dot();
    }
    list.push(dot);

    addModifierToDot(dot)

    return dot;
  }

  this.updateWithGrid = (w, h) => {
    const containerRect = containerEl.getBoundingClientRect();
    const squareWidth = containerRect.width / w;
    const squareHeight = containerRect.height / h;

    list.forEach(dot => {
      const el = dot.getEl();
      const style = el.style;
      const {x, y} = dot.getPosition();
      const nx = Math.floor(x * squareWidth);
      const ny = Math.floor(y * squareHeight);
      const transform = `translate(${nx}px, ${ny}px)`;
      if (style.transform !== transform) {
        style.transform = transform;
      }
      if (style.height !== squareHeight) {
        style.height = squareHeight;
      }
      if (style.width !== squareWidth) {
        style.width = squareWidth;
      }
    });
  }
}

function Level(w, h, numDots, dotFactory) {
  applyEmitter(this);
  var i,
    grid = createGrid(w, h),
    dots = [];

  for (i = 0; i < numDots; i++) {
    const {x, y} = findFreeSquare(grid);
    const dot = dotFactory.createDot();

    dot.setPosition(x, y);
    dots.push(dot);
    grid[x][y] = dot;
  }

  this.isFree = (x, y) => {
    return x >= 0 && x < w && y >= 0 && y < h && !grid[x][y];
  }

  this.get = (x, y) => {
    return grid[x] && grid[x][y];
  }

  this.set = (x, y, dot) => {
    if (grid[x][y]) {
      return false;
    }
    dots.push(dot);
    grid[x][y] = dot;
    dot.setPosition(x, y);
  }

  this.unset = (x, y) => {
    const dot = grid[x][y];
    grid[x][y] = undefined;

    const index = dots.indexOf(dot);
    if (index > -1) {
      dots.splice(index, 1);
    }

    if (!dots.length) {
      this.emit('empty');
    }

    return dot;
  }

  this.update = () => {
    dotFactory.updateWithGrid(w, h);
  }

  this.destroy = () => {
    dots.forEach(dot => dot.destroy());
  }
}

function SplashScreen() {
  applyEmitter(this);
  const splashScreenConfig = config.splashScreen;
  var cursor = 0;
  var menuItems = splashScreenConfig.menuItems;
  const menuBehaviors = {
    'playGame': () => this.emit('end', {to: 'ingame'}),
    'showCredits': () => this.emit('end', {to: 'credits'}),
    'showScore': () => this.emit('end', {to: 'score'}),
  };
  const handleNextItem = () => menu.selectNext();
  const handlePrevItem = () => menu.selectPrev();
  const handleSelection = () => menuBehaviors[menu.getSelectedItem().behavior]();
  const keyboardCodes = {
    'KeyS': handleNextItem,
    'ArrowDown': handleNextItem,
    'KeyD': handleNextItem,
    'ArrowRight': handleNextItem,
    'KeyW': handlePrevItem,
    'ArrowUp': handlePrevItem,
    'KeyA': handlePrevItem,
    'ArrowLeft': handlePrevItem,
    'Space': handleSelection,
    'Enter': handleSelection,
  }

  const screen = new Screen(keyboardCodes);
  const el = screen.getEl();
  el.classList.add('splash-screen');
  const menu = new Menu(menuItems, el);
  menu.on('click', handleSelection);

  this.getEl = () => {
    return screen.getEl();
  }

  this.start = () => {
    screen.bindWindow();
  }

  this.releaseWindow = screen.releaseWindow;
  this.destroy = function () {
    screen.destroy();
  }
}

function ScoreScreen() {
  applyEmitter(this);
  const scoreConfig = config.creditsScreen;
  const handleSelection = () => this.emit('end', {to: 'splash'});
  const stats = Object.assign({
    levelNumber: 0,
    movementInterval: 250000,
    levelNumDots: 0,
    levelWidth: config.level.width,
    levelHeight: config.level.height,
    dotPercentage: 0
  }, StatKeeper.get());
  const keyboardCodes = {
    'Space': handleSelection,
    'Enter': handleSelection,
  }

  const screen = new Screen(keyboardCodes);
  const el = screen.getEl();
  el.classList.add('score-screen');
  el.appendChild(createTextEl('score-screen__title', 'PERSONAL_BEST'));
  el.appendChild(createTextEl('score-screen__score-label', 'HIGHEST_LEVEL'));
  el.appendChild(createTextEl('score-screen__score-value', stats.levelNumber));
  el.appendChild(createTextEl('score-screen__score-label', 'NUMBER_OF_DOTS'));
  el.appendChild(createTextEl('score-screen__score-value', stats.levelNumDots));
  el.appendChild(createTextEl('score-screen__score-label', 'SCREEN_SIZE'));
  el.appendChild(createTextEl('score-screen__score-value', `${stats.levelWidth}x${stats.levelHeight}`));
  el.appendChild(createTextEl('score-screen__score-label', 'DOT_PERCENTAGE'));
  el.appendChild(createTextEl('score-screen__score-value', `${Math.floor(stats.dotPercentage * 100)}%`));
  const primaryButton = createPrimaryButton('score-screen__primary-button', {labelTag: 'OKAY', onClick: handleSelection});
  el.appendChild(primaryButton); 

  this.getEl = () => screen.getEl();
  this.start = () => screen.bindWindow();
  this.releaseWindow = screen.releaseWindow;
  this.destroy = function () {
    screen.destroy();
  }
}

function CreditsScreen() {
  applyEmitter(this);
  const screenConfig = config.creditsScreen;
  const handleSelection = () => this.emit('end', {to: 'splash'});
  const keyboardCodes = {
    'Space': handleSelection,
    'Enter': handleSelection,
  }

  const screen = new Screen(keyboardCodes);
  const el = screen.getEl();
  el.classList.add('credits-screen');
  el.appendChild(createTextEl('credits-screen__title', 'CREDITS'));
  el.appendChild(createTextEl('credits-screen__description', 'CREDITS_DESCRIPTION'));
  const primaryButton = createPrimaryButton('credits-screen__primary-button', {labelTag: 'OKAY', onClick: handleSelection});
  el.appendChild(primaryButton); 

  this.getEl = () => screen.getEl();
  this.start = () => screen.bindWindow();
  this.releaseWindow = screen.releaseWindow;
  this.destroy = function () {
    screen.destroy();
  }
}

function InGameScreen() {
  const levelConfig = config.level;
  var levelWidth = levelConfig.width;
  var levelHeight = levelConfig.height;
  var levelNumDots = levelConfig.numDots;
  var dotPercentage = levelConfig.dotPercentage;
  var levelNumber = 1;
  var movementInterval = config.snake.movementInterval;
  var level;
  var snake;
  applyEmitter(this);
  const handleUp = () => snake.setDirection(0, -1);
  const handleDown = () => snake.setDirection(0, 1);
  const handleLeft = () => snake.setDirection(-1, 0);
  const handleRight = () => snake.setDirection(1, 0);
  const handlePause = () => runtime.togglePause();

  const menuBehaviors = {
    nextLevel: () => {
      teardown();
      levelNumDots += levelConfig.numDotsIncrease;
      levelNumber += 1;
      var totalDotPercentage = levelNumDots / (levelWidth * levelHeight);
      if (totalDotPercentage > dotPercentage && totalDotPercentage < levelConfig.dotPercentageMax) {
        levelWidth += levelConfig.widthIncrease;
        levelHeight += levelConfig.heightIncrease;
        dotPercentage += levelConfig.dotPercentageIncrease;
      }
      movementInterval = Math.floor(movementInterval * 0.95);
      console.log('increased challenge', {
        levelNumber,
        levelNumDots,
        levelWidth,
        levelHeight,
        dotPercentage: totalDotPercentage,
      });
      setup();
    },
    playAgain: () => {
      teardown();
      setup();
    },
    mainMenu: () => this.emit('end', {to: 'splash'})
  }

  const keyboardCodes = {
    'KeyS': handleDown,
    'ArrowDown': handleDown,
    'KeyD': handleRight,
    'ArrowRight': handleRight,
    'KeyW': handleUp,
    'ArrowUp': handleUp,
    'KeyA': handleLeft,
    'ArrowLeft': handleLeft,
    'Space': handlePause,
    'Escape': handlePause
  }

  const screen = new Screen(keyboardCodes);
  const el = screen.getEl();
  el.classList.add('ingame-screen');
  const dotFactory = new DotFactory(el);
  const overlay = new OverlayText(el, 'READY');
  const runtime = new Runtime([overlay]);

  function setup() {
    level = new Level(levelWidth, levelHeight, levelNumDots, dotFactory);
    runtime.addEntity(level);
    snake = new Snake(levelConfig.startingPosition, level, movementInterval, dotFactory);
    runtime.addEntity(snake);

    function levelOverlay(levelOverlayConfig) {
      return function () {
        runtime.removeEntity(snake);

        StatKeeper.saveHighest({
          levelNumber,
          levelNumDots,
          levelWidth,
          levelHeight,
          dotPercentage: levelNumDots / (levelWidth * levelHeight)
        });

        const levelOverlay = new OverlayTextMenu(el, levelOverlayConfig);
        levelOverlay.once('end', e => {
          levelOverlay.destroy();
          screen.bindWindow();
          runtime.removeEntity(levelOverlay);
          menuBehaviors[e.to]();
        });
        screen.releaseWindow();
        levelOverlay.bindWindow();
        runtime.addEntity(levelOverlay);
      }
    }

    snake.on('death', levelOverlay(config.levelLose));
    level.on('empty', levelOverlay(config.levelWin));
  }

  function teardown() {
    level.destroy();
    runtime.removeEntity(level);
    snake.destroy();
    runtime.removeEntity(snake);
  }

  this.getEl = () => {
    return screen.getEl();
  }
  this.start = () => {
    screen.bindWindow();
    console.log('start InGameScreen');
    overlay.end();
  };
  this.releaseWindow = screen.releaseWindow;
  this.destroy = function () {
    screen.destroy();
    level.destroy();
    runtime.destroy();
    snake.destroy();
  }

  setup();
}

function Screen(keyboardCodes) {
  const handleKeyboard = (e) => {
    console.log('key', e.code);
    if (!e.preventDefaulted && keyboardCodes[e.code]) {
      e.preventDefault();
      if (keyboardCodes[e.code]) {
        keyboardCodes[e.code]();
      } else {
        this.emit('unhandled keyboard code', e.code);
      }
    }
  }
  const windowEvents = [
    { name: 'keydown', fn: handleKeyboard }
  ];
  const el = createEl('screen');

  this.getEl = function () {
    return el;
  }

  this.bindWindow = function () {
    windowEvents.forEach(event => window.addEventListener(event.name, event.fn));
  }

  function releaseWindow() {
    windowEvents.forEach(event => window.removeEventListener(event.name, event.fn));
  }

  this.releaseWindow = releaseWindow;

  this.destroy = () => {
    releaseWindow();
  }
}

function Snake(startPosition, level, movementInterval, dotFactory) {
  applyEmitter(this);
  var safeZone = config.snake.safeZone;
  var snakeModifiers = config.snake.modifiers;
  const dots = [];
  for (var i = 0; i < config.snake.initialSize; i++) {
    const dot = level.unset(startPosition.x, startPosition.y + i) || dotFactory.createDot();
    addSnakeModifierToDot(dot);
    dot.setPosition(startPosition.x, startPosition.y + i);
    dots.push(dot);
  }
  var dx = 0, dy = 0, totalPassed = 0, inForgiveness = false;

  function addSnakeModifierToDot(dot) {
    const n = Math.floor(Math.random() * snakeModifiers.length);
    dot.addModifier(snakeModifiers[n]);
  }

  function eat(x, y, level) {
    const dot = level.unset(x, y);
    addSnakeModifierToDot(dot);
    dots.unshift(dot);
  }

  function move() {
    const firstDot = dots[0];
    const {x, y} = firstDot.getPosition();
    lastDot = dots.pop();
    lastDot.setPosition(x + dx, y + dy);
    dots.unshift(lastDot);
  }

  function isFree(nx, ny, limit) {
    for (var i = 0; i < Math.min(dots.length, limit); i++) {
      const dot = dots[i];
      const {x, y} = dot.getPosition();
      if (nx === x && ny === y) {
        return false;
      }
    }
    return true;
  }

  this.setDirection = (ndx, ndy) => {
    // don't let them go out of their way to eat their immediate self
    const {x, y} = dots[0].getPosition();
    if(!isFree(x + ndx, y + ndy, safeZone)) {
      return;
    }

    dx = ndx;
    dy = ndy;
  }

  this.update = passed => {
    // if dot exists, eat it, otherwise move
    totalPassed += passed;
    if (totalPassed > movementInterval) {
      totalPassed = 0;
      const {x, y} = dots[0].getPosition();
      const nx = x + dx;
      const ny = y + dy;

      if (dx === 0 && dy === 0) {
        // do nothing
      } else if (level.isFree(nx, ny) && isFree(nx, ny, Infinity)) {
        move();
      } else if (level.get(nx, ny)) {
        eat(nx, ny, level);
        this.emit('ate', {snake: this, dot: level.get(nx, ny)});
        if (inForgiveness) {
          this.emit('forgiven', {snake: this, dot: level.get(nx, ny)});
          inForgiveness = false;
        }
      } else {
        if (!inForgiveness) {
          // forgiveness is a bit of time to prevent death
          // also gives us a chance to do a rare special effect
          this.emit('forgiveness', {snake: this});
          inForgiveness = true;
          totalPassed = movementInterval / 2;
        } else {
          this.emit('death');
        }
      }
    }
  }

  this.destroy = function () {
    dots.forEach(dot => dot.destroy());
  }
}

function Runtime(entities) {
  var lastPassed;
  var killerId;
  var isPaused = false;

  // ping pong-like functions (A and B) prevent a memory leak in chrome when using requestAnimationFrame
  function updateA(totalPassed) {
    const passed = Math.floor((totalPassed - lastPassed) * 1000000);
    lastPassed = totalPassed;
    
    if (!isPaused) {
      entities.forEach(entity => entity.update(passed));
    }

    cancelId = window.requestAnimationFrame(updateB);
  }

  function updateB(totalPassed) {
    const passed = Math.floor((totalPassed - lastPassed) * 1000000);
    lastPassed = totalPassed;
    
    if (!isPaused) {
      entities.forEach(entity => entity.update(passed));
    }

    cancelId = window.requestAnimationFrame(updateA);
  }

  this.addEntity = entity => {
    const index = entities.indexOf(entity);
    if (index === -1) {
      entities.push(entity)
    }
  }

  this.removeEntity = entity => {
    const index = entities.indexOf(entity);

    if (index > -1) {
      entities.splice(index, 1);
    }
  }

  this.togglePause = () => {
    isPaused = !isPaused;
  }

  this.pause = value => {
    isPaused = value !== false;
  }

  this.destroy = () => {
    window.cancelAnimationFrame(cancelId)
    isKilled = true;
  }

  window.requestAnimationFrame(passed => {
    lastPassed = passed;
    window.requestAnimationFrame(updateA);
  });
}

function Game(containerEl) {
  var el = createEl('game');
  el.appendChild(createEl('enforce-43-ratio'));
  var currentScreen;
  const overlay = new Overlay(el);
  const screens = {
    splash: SplashScreen,
    ingame: InGameScreen,
    credits: CreditsScreen,
    score: ScoreScreen
  }
  const InitialScreen = screens[config.initialScreen];

  var p = 0;

  function waitForTheEnd() {
    const pp = p++;
    currentScreen.start();
    currentScreen.once('end', e => {
      const ppp = p++;
      currentScreen.releaseWindow();
      overlay.fade('black', function () {
        const pppp = p++;
        console.log('fadedToBlack', p, pp, ppp, pppp, e.to);
        currentScreen.destroy();
        el.removeChild(currentScreen.getEl());
        if (screens[e.to]) {
          currentScreen = new screens[e.to]();
        } else {
          currentScreen = new InitialScreen();
        }
        el.appendChild(currentScreen.getEl());
        overlay.fade('none', waitForTheEnd);
      });
    });
  }

  this.start = () => {
    currentScreen = new InitialScreen();
    el.appendChild(currentScreen.getEl());
    waitForTheEnd();
  }

  this.destroy = () => {
    screen.destroy();
    level.destroy();
    entities.forEach(entity => entity.destroy());
  }

  containerEl.appendChild(el);
}

var game = new Game(document.body);
game.start();
