/* ── CONFIG ──────────────────────────────────────────────────── */
const SITE_ROOT     = document.documentElement.dataset.root ?? '.';
const POSTS_URL     = `${SITE_ROOT}/content/posts`;
const THOUGHTS_URL  = `${SITE_ROOT}/content/thoughts/index.json`;
const PAGE_SIZE     = 20;
const THEME_KEY     = 'theme';
const DEFAULT_THEME = 'dark';

/* ── PROJECTS DATA ───────────────────────────────────────────── */
const PROJECTS = [
  {
    name: 'Sample Project',
    description: 'A placeholder — add your 88 Studios projects here.',
    url: 'https://github.com/henriquehorbovyi',
    date: '2025',
  },
];

/* ── STATE (blog only) ───────────────────────────────────────── */
const state = {
  posts: [],
  totalPages: 1,
  blogPage: 1,
};

/* ── THEME ───────────────────────────────────────────────────── */
function initTheme() {
  const saved = localStorage.getItem(THEME_KEY) ?? DEFAULT_THEME;
  applyTheme(saved);
  document.getElementById('theme-toggle').addEventListener('click', toggleTheme);
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  document.getElementById('theme-toggle').textContent = theme === 'dark' ? '☀' : '◑';
  localStorage.setItem(THEME_KEY, theme);
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme');
  applyTheme(current === 'dark' ? 'light' : 'dark');
}

/* ── DATA FETCHING ───────────────────────────────────────────── */
async function fetchJSON(path) {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`Failed to fetch ${path} (${res.status})`);
  return res.json();
}

async function fetchText(path) {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`Failed to fetch ${path} (${res.status})`);
  return res.text();
}


/* ── DATE ────────────────────────────────────────────────────── */
const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December'
];

function formatDate(str) {
  // "DD-MM-YYYY" → "D Month YYYY"
  const dmy = str.match(/^(\d{2})-(\d{2})-(\d{4})$/);
  if (dmy) return `${parseInt(dmy[1])} ${MONTHS[parseInt(dmy[2]) - 1]} ${dmy[3]}`;

  // "DD Month YYYY" → normalise (strip leading zero from day)
  const named = str.match(/^(\d{1,2})\s+(\w+)\s+(\d{4})$/);
  if (named) return `${parseInt(named[1])} ${named[2]} ${named[3]}`;

  return str;
}

/* ── UTILS ───────────────────────────────────────────────────── */
function spinner() {
  const div = document.createElement('div');
  div.className = 'spinner';
  return div;
}

function errorMsg(text) {
  const p = document.createElement('p');
  p.className = 'error-msg';
  p.textContent = text;
  return p;
}

/* ── BLOG ────────────────────────────────────────────────────── */
async function initBlog() {
  const blogList       = document.getElementById('blog-list');
  const blogPagination = document.getElementById('blog-pagination');

  blogList.replaceChildren(spinner());

  try {
    const data = await fetchJSON(`${POSTS_URL}/index.json`);
    state.posts      = data.posts ?? [];
    state.totalPages = Math.max(1, Math.ceil(state.posts.length / PAGE_SIZE));
  } catch {
    blogList.replaceChildren(errorMsg('Could not load post list.'));
    return;
  }

  renderBlogList(blogList, blogPagination);
}

function renderBlogList(blogList, blogPagination) {
  const start = (state.blogPage - 1) * PAGE_SIZE;
  const slice = state.posts.slice(start, start + PAGE_SIZE);

  const ul = document.createElement('ul');
  ul.className = 'post-list';
  slice.forEach((post) => {
    const li = document.createElement('li');
    li.className = 'post-item';
    li.innerHTML = `
      <span class="post-title">${post.title}</span>
      <span class="post-date">${formatDate(post.publishedAt)}</span>
    `;
    li.addEventListener('click', () => {
      window.location.href = `post.html?slug=${post.slug}`;
    });
    ul.appendChild(li);
  });

  blogList.replaceChildren(ul);
  renderPagination(blogPagination, blogList);
}

function renderPagination(blogPagination, blogList) {
  blogPagination.innerHTML = '';
  if (state.totalPages <= 1) return;

  for (let i = 1; i <= state.totalPages; i++) {
    const btn = document.createElement('button');
    btn.textContent = i;
    if (i === state.blogPage) btn.classList.add('active');
    btn.addEventListener('click', () => {
      state.blogPage = i;
      renderBlogList(blogList, blogPagination);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
    blogPagination.appendChild(btn);
  }
}

/* ── THOUGHTS ────────────────────────────────────────────────── */
async function initThoughts() {
  const list = document.getElementById('thoughts-list');
  list.replaceChildren(spinner());

  try {
    const data = await fetchJSON(THOUGHTS_URL);
    const thoughts = [...(data.thoughts ?? [])].reverse();

    if (thoughts.length === 0) {
      list.replaceChildren(errorMsg('No thoughts yet.'));
      return;
    }

    const container = document.createElement('div');
    thoughts.forEach((t) => {
      const item = document.createElement('div');
      item.className = 'post-item thought-item';
      item.innerHTML = `
        <span class="post-title">${t.text}</span>
        <span class="post-date">${formatDate(t.date)}</span>
      `;
      container.appendChild(item);
    });
    list.replaceChildren(container);
  } catch {
    list.replaceChildren(errorMsg('Could not load thoughts.'));
  }
}

/* ── POST ────────────────────────────────────────────────────── */
async function initPost() {
  const article = document.getElementById('post-content');
  const slug = new URLSearchParams(window.location.search).get('slug');

  if (!slug) {
    article.replaceChildren(errorMsg('No post specified.'));
    return;
  }

  article.replaceChildren(spinner());

  try {
    const html = await fetchText(`${POSTS_URL}/${slug}/index.html`);
    article.innerHTML = html;
    const h1 = article.querySelector('h1');
    if (h1) document.title = `${h1.textContent} — henriquehorbovyi.dev`;
  } catch {
    article.replaceChildren(errorMsg('Could not load post.'));
  }
}

/* ── PROJECTS ────────────────────────────────────────────────── */
function initProjects() {
  const container = document.getElementById('projects-list');
  PROJECTS.forEach((p) => {
    const item = document.createElement('div');
    item.className = 'project-item';
    item.innerHTML = `
      <div class="project-header">
        <a class="project-link project-name" href="${p.url}" target="_blank" rel="noopener">${p.name}</a>
        <span class="project-date">${p.date}</span>
      </div>
      <p class="project-desc">${p.description}</p>
    `;
    container.appendChild(item);
  });
}

/* ── BOOT ────────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  initTheme();

  switch (document.body.dataset.page) {
    case 'blog':     initBlog();     break;
    case 'thoughts': initThoughts(); break;
    case 'projects': initProjects(); break;
    case 'post':     initPost();     break;
  }
});
