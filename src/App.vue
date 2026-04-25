<template>
  <main class="phone-shell">
    <header class="app-header">
      <button v-if="page !== 'home'" class="icon-button" type="button" aria-label="返回" @click="goHome">
        <ChevronLeft :size="26" />
      </button>
      <span v-else class="icon-spacer"></span>
      <div class="title-block">
        <p>{{ ipLabel }}</p>
        <h1>{{ pageTitle }}</h1>
      </div>
      <button class="icon-button" type="button" aria-label="刷新" @click="refreshCurrent">
        <RefreshCw :size="20" />
      </button>
    </header>

    <section v-if="page === 'home'" class="home-page">
      <div class="hero-card">
        <div class="hero-top">
          <span>今日计划</span>
          <strong>{{ dailyTarget }} 词</strong>
        </div>
        <div class="target-row">
          <button type="button" aria-label="减少数量" @click="updateDailyTarget(dailyTarget - 5)">
            <Minus :size="20" />
          </button>
          <input v-model.number="targetInput" inputmode="numeric" />
          <button type="button" aria-label="增加数量" @click="updateDailyTarget(dailyTarget + 5)">
            <Plus :size="20" />
          </button>
        </div>
        <div class="progress-line">
          <span>已背 {{ stats.learnedCount || 0 }}</span>
          <span>剩余 {{ stats.remainingCount || 0 }}</span>
        </div>
      </div>

      <div class="action-grid">
        <button class="home-action primary" type="button" @click="startStudy">
          <PlayCircle :size="25" />
          <span>开始背诵</span>
          <small>自动跳过已背词</small>
        </button>
        <button class="home-action" type="button" @click="openList('learned')">
          <BookOpenCheck :size="24" />
          <span>背过的内容</span>
          <small>{{ stats.learnedCount || 0 }} 个</small>
        </button>
        <button class="home-action" type="button" @click="openList('all')">
          <LibraryBig :size="24" />
          <span>全部词库</span>
          <small>{{ stats.totalWords || 0 }} 个</small>
        </button>
      </div>
    </section>

    <section v-else-if="page === 'study'" class="study-page">
      <div class="study-progress">
        <span>{{ studyIndex + 1 > sessionWords.length ? sessionWords.length : studyIndex + 1 }}/{{ sessionWords.length }}</span>
        <strong>{{ rememberedInSession }} 记得 / {{ forgottenInSession }} 忘记</strong>
      </div>
      <div class="progress-track">
        <div class="progress-fill" :style="{ width: `${studyProgress}%` }"></div>
      </div>

      <article v-if="currentWord" class="study-card" :class="{ answered: answerShown }">
        <div class="badge-row">
          <span class="badge" :data-level="currentWord.reliabilityLevel">{{ currentWord.reliabilityLevel }}级</span>
          <span>{{ currentWord.exactFrequency ? `考频 ${currentWord.exactFrequency} 次` : '高频候选' }}</span>
        </div>
        <div class="word-center">
          <h2>{{ currentWord.word }}</h2>
        </div>
        <div class="answer-panel" :class="{ visible: answerShown }">
          <p>{{ currentWord.explanation || '暂无释义。' }}</p>
          <div class="meta-row">
            <span>可信 {{ Math.round(currentWord.confidence * 100) }}%</span>
            <span>来源 {{ currentWord.sourceSiteCount }}</span>
            <span>出现 {{ currentWord.occurrenceCount }}</span>
          </div>
        </div>
      </article>

      <div v-else class="empty-card">
        <Trophy :size="42" />
        <p>{{ sessionWords.length ? '本轮完成' : '没有新词了' }}</p>
        <button class="solid-button" type="button" @click="goHome">回到主页</button>
      </div>

      <div v-if="currentWord" class="study-actions">
        <template v-if="!answerShown">
          <button class="choice-button forget" type="button" @click="submitAnswer(false)">
            <XCircle :size="20" />
            忘记
          </button>
          <button class="choice-button remember" type="button" @click="submitAnswer(true)">
            <CheckCircle2 :size="20" />
            记得
          </button>
        </template>
        <template v-else>
          <button class="soft-button" type="button" @click="toggleFavorite(currentWord)">
            <Star :size="19" :fill="currentWord.favorite ? 'currentColor' : 'none'" />
            {{ currentWord.favorite ? '已收藏' : '收藏' }}
          </button>
          <button class="solid-button" type="button" @click="nextStudyWord">
            下一个
            <ChevronRight :size="20" />
          </button>
        </template>
      </div>
    </section>

    <section v-else class="list-page">
      <div class="tabs">
        <button type="button" :class="{ active: listType === 'learned' }" @click="openList('learned')">
          已背
        </button>
        <button type="button" :class="{ active: listType === 'all' }" @click="openList('all')">
          全部
        </button>
      </div>

      <label class="search-box">
        <Search :size="18" />
        <input v-model.trim="query" type="search" placeholder="搜索成语或释义" @input="loadWords" />
      </label>

      <div class="list-count">{{ words.length }} 词</div>

      <div class="word-list">
        <button
          v-for="word in words"
          :key="word.word"
          class="word-row"
          :class="{ expanded: expandedWord === word.word, learned: word.learned }"
          type="button"
          @click="expandedWord = expandedWord === word.word ? '' : word.word"
        >
          <div class="row-main">
            <strong>{{ word.word }}</strong>
            <span>{{ rowSubTitle(word) }}</span>
          </div>
          <div class="row-icons">
            <Star v-if="word.favorite" :size="18" fill="currentColor" />
            <CheckCircle2 v-if="word.learned" :size="18" />
          </div>
          <div v-if="expandedWord === word.word" class="row-detail">
            <p>{{ word.explanation || '暂无释义。' }}</p>
            <div>
              <span>{{ word.reliabilityLevel }}级</span>
              <span>{{ word.exactFrequency ? `考频 ${word.exactFrequency}` : '高频候选' }}</span>
              <span>{{ word.learned ? learnedLabel(word) : '未背' }}</span>
            </div>
          </div>
        </button>
      </div>
    </section>
  </main>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import {
  BookOpenCheck,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  LibraryBig,
  Minus,
  PlayCircle,
  Plus,
  RefreshCw,
  Search,
  Star,
  Trophy,
  XCircle,
} from 'lucide-vue-next'
import localIdioms from './data/idioms.json'

const page = ref('home')
const ip = ref('')
const apiConnected = ref(false)
const dailyTarget = ref(30)
const targetInput = ref(30)
const stats = ref({})
const sessionWords = ref([])
const studyIndex = ref(0)
const answerShown = ref(false)
const sessionAnswers = ref({})
const listType = ref('learned')
const words = ref([])
const query = ref('')
const expandedWord = ref('')
const LOCAL_KEY = 'idiom-study-offline-progress-v1'

function readLocalState() {
  const state = JSON.parse(
    localStorage.getItem(LOCAL_KEY) ||
      '{"dailyTarget":30,"learned":{},"favorites":{}}',
  )
  state.dailyTarget = state.dailyTarget || 30
  state.learned = state.learned || {}
  state.favorites = state.favorites || {}
  return state
}

function writeLocalState(state) {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(state))
}

function localStats(state = readLocalState()) {
  const learnedItems = Object.values(state.learned || {})
  return {
    totalWords: localIdioms.length,
    learnedCount: learnedItems.length,
    rememberedCount: learnedItems.filter((item) => item.remembered).length,
    forgottenCount: learnedItems.filter((item) => !item.remembered).length,
    favoriteCount: Object.keys(state.favorites || {}).length,
    remainingCount: Math.max(0, localIdioms.length - learnedItems.length),
  }
}

function decorateLocalWord(word, state = readLocalState()) {
  const learned = state.learned?.[word.word]
  return {
    ...word,
    learned: Boolean(learned),
    remembered: learned?.remembered ?? null,
    learnedAt: learned?.learnedAt || null,
    favorite: Boolean(state.favorites?.[word.word]),
  }
}

function localWordList(type = 'all', keyword = '') {
  const state = readLocalState()
  const lower = keyword.trim().toLowerCase()
  return localIdioms
    .filter((word) => {
      if (type === 'learned' && !state.learned?.[word.word]) return false
      if (type === 'remaining' && state.learned?.[word.word]) return false
      if (!lower) return true
      return (
        word.word.toLowerCase().includes(lower) ||
        (word.explanation || '').toLowerCase().includes(lower)
      )
    })
    .map((word) => decorateLocalWord(word, state))
}

const currentWord = computed(() => sessionWords.value[studyIndex.value])
const pageTitle = computed(() => {
  if (page.value === 'study') return currentWord.value?.word || '抽背'
  if (page.value === 'list') return listType.value === 'learned' ? '背过的内容' : '全部词库'
  return '公考成语'
})
const ipLabel = computed(() => (apiConnected.value && ip.value ? `IP ${ip.value}` : '本地词库'))
const rememberedInSession = computed(
  () => Object.values(sessionAnswers.value).filter((value) => value === true).length,
)
const forgottenInSession = computed(
  () => Object.values(sessionAnswers.value).filter((value) => value === false).length,
)
const studyProgress = computed(() => {
  if (!sessionWords.value.length) return 0
  return Math.round((Math.min(studyIndex.value, sessionWords.value.length) / sessionWords.value.length) * 100)
})

async function api(path, options = {}) {
  const response = await fetch(path, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  if (!response.ok) {
    throw new Error(`API ${response.status}`)
  }
  return response.json()
}

async function loadMe() {
  try {
    const data = await api('/api/me')
    apiConnected.value = true
    ip.value = data.ip
    dailyTarget.value = data.dailyTarget
    targetInput.value = data.dailyTarget
    stats.value = data.stats
  } catch (error) {
    const state = readLocalState()
    apiConnected.value = false
    ip.value = ''
    dailyTarget.value = state.dailyTarget || 30
    targetInput.value = dailyTarget.value
    stats.value = localStats(state)
  }
}

async function updateDailyTarget(value) {
  const next = Math.min(100, Math.max(5, Number(value) || 30))
  try {
    const data = await api('/api/settings', {
      method: 'PUT',
      body: JSON.stringify({ dailyTarget: next }),
    })
    apiConnected.value = true
    dailyTarget.value = data.dailyTarget
    targetInput.value = data.dailyTarget
    stats.value = data.stats
  } catch (error) {
    const state = readLocalState()
    state.dailyTarget = next
    writeLocalState(state)
    apiConnected.value = false
    dailyTarget.value = next
    targetInput.value = next
    stats.value = localStats(state)
  }
}

async function startStudy() {
  try {
    const data = await api(`/api/session?limit=${dailyTarget.value}`)
    apiConnected.value = true
    sessionWords.value = data.words
    stats.value = data.stats
  } catch (error) {
    const state = readLocalState()
    apiConnected.value = false
    sessionWords.value = localWordList('remaining').slice(0, dailyTarget.value)
    stats.value = localStats(state)
  }
  sessionAnswers.value = {}
  studyIndex.value = 0
  answerShown.value = false
  page.value = 'study'
}

async function submitAnswer(remembered) {
  if (!currentWord.value) return
  let nextStats = stats.value
  try {
    const data = await api('/api/answer', {
      method: 'POST',
      body: JSON.stringify({ word: currentWord.value.word, remembered }),
    })
    apiConnected.value = true
    nextStats = data.stats
  } catch (error) {
    const state = readLocalState()
    state.learned[currentWord.value.word] = {
      remembered,
      learnedAt: new Date().toISOString(),
    }
    writeLocalState(state)
    apiConnected.value = false
    nextStats = localStats(state)
  }
  sessionAnswers.value = {
    ...sessionAnswers.value,
    [currentWord.value.word]: remembered,
  }
  stats.value = nextStats
  currentWord.value.learned = true
  currentWord.value.remembered = remembered
  answerShown.value = true
}

function nextStudyWord() {
  studyIndex.value += 1
  answerShown.value = false
}

async function toggleFavorite(word) {
  try {
    const data = await api('/api/favorite', {
      method: 'POST',
      body: JSON.stringify({ word: word.word }),
    })
    apiConnected.value = true
    word.favorite = data.favorite
    stats.value = data.stats
  } catch (error) {
    const state = readLocalState()
    if (state.favorites[word.word]) {
      delete state.favorites[word.word]
    } else {
      state.favorites[word.word] = new Date().toISOString()
    }
    writeLocalState(state)
    apiConnected.value = false
    word.favorite = Boolean(state.favorites[word.word])
    stats.value = localStats(state)
  }
}

async function openList(type) {
  listType.value = type
  page.value = 'list'
  expandedWord.value = ''
  await loadWords()
}

async function loadWords() {
  try {
    const data = await api(
      `/api/words?type=${encodeURIComponent(listType.value)}&query=${encodeURIComponent(query.value)}&limit=500`,
    )
    apiConnected.value = true
    words.value = data.words
    stats.value = data.stats
  } catch (error) {
    const state = readLocalState()
    apiConnected.value = false
    words.value = localWordList(listType.value, query.value).slice(0, 500)
    stats.value = localStats(state)
  }
}

function rowSubTitle(word) {
  if (word.exactFrequency) return `考频 ${word.exactFrequency} 次`
  return `${word.reliabilityLevel}级候选 · 可信 ${Math.round(word.confidence * 100)}%`
}

function learnedLabel(word) {
  if (word.remembered === true) return '记得'
  if (word.remembered === false) return '忘记'
  return '已背'
}

function goHome() {
  page.value = 'home'
  loadMe()
}

function refreshCurrent() {
  if (page.value === 'list') {
    loadWords()
  } else if (page.value === 'study') {
    startStudy()
  } else {
    loadMe()
  }
}

watch(targetInput, (value) => {
  if (value !== dailyTarget.value) updateDailyTarget(value)
})

onMounted(loadMe)
</script>
