const cfg = window.MERI_GATHA_CONFIG || {};
const configured = cfg.supabaseUrl && cfg.supabaseKey &&
  !cfg.supabaseUrl.includes("PASTE_") && !cfg.supabaseKey.includes("PASTE_");

const supabaseClient = configured ? window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseKey) : null;

const thoughtForm = document.getElementById("thoughtForm");
const thoughtList = document.getElementById("thoughtList");
const formMessage = document.getElementById("formMessage");
const communityStatus = document.getElementById("communityStatus");
const contactForm = document.getElementById("contactForm");
const contactMessage = document.getElementById("contactMessage");
const themeToggle = document.getElementById("themeToggle");

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

function makeCommunityCard(post) {
  const card = document.createElement("article");
  card.className = "community-card";
  const displayName = (post.nickname || "Anonymous").trim() || "Anonymous";
  const avatar = displayName.charAt(0).toUpperCase();
  const date = post.created_at ? new Date(post.created_at).toLocaleDateString(undefined, {day:"numeric", month:"short", year:"numeric"}) : "";
  card.innerHTML = `
    <div class="avatar">${escapeHtml(avatar)}</div>
    <div>
      <span class="tag">${escapeHtml(post.category || "Thought")}</span>
      <p>“${escapeHtml(post.content)}”</p>
      <small>— ${escapeHtml(displayName)}${date ? ` · ${escapeHtml(date)}` : ""}</small>
      <div class="card-actions"><button class="community-like" data-id="${escapeHtml(post.id)}">♡ <span>${post.likes || 0}</span></button></div>
    </div>`;
  return card;
}

async function loadThoughts() {
  if (!supabaseClient) {
    communityStatus.textContent = "Connect Supabase to enable the live community feed.";
    thoughtList.innerHTML = `<article class="community-card demo-notice"><div class="avatar">M</div><div><span class="tag">Setup</span><p>Your community feed will appear here after you add the Supabase settings in config.js.</p><small>— Meri Gatha</small></div></article>`;
    return;
  }

  const { data, error } = await supabaseClient
    .from("thoughts")
    .select("id,nickname,category,content,created_at,likes")
    .eq("status", "approved")
    .order("created_at", { ascending: false })
    .limit(30);

  if (error) {
    communityStatus.textContent = "The community feed could not be loaded.";
    console.error(error);
    return;
  }

  communityStatus.textContent = data.length ? "Real thoughts shared by the community." : "Be the first to share a thought.";
  thoughtList.innerHTML = "";
  data.forEach(post => thoughtList.appendChild(makeCommunityCard(post)));
}

thoughtForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const nickname = document.getElementById("name").value.trim() || "Anonymous";
  const content = document.getElementById("thought").value.trim();
  const category = document.getElementById("category").value;
  if (!content) return;

  if (!supabaseClient) {
    formMessage.textContent = "Supabase is not connected yet. Add your project settings in config.js.";
    return;
  }

  formMessage.textContent = "Sending for review…";
  const { error } = await supabaseClient.from("thoughts").insert({
    nickname, content, category, status: "pending", likes: 0
  });

  if (error) {
    console.error(error);
    formMessage.textContent = "Sorry, your thought could not be submitted. Please try again.";
    return;
  }

  thoughtForm.reset();
  formMessage.textContent = "Thank you. Your thought was saved and is waiting for approval.";
  setTimeout(() => formMessage.textContent = "", 5000);
});

contactForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!supabaseClient) {
    contactMessage.textContent = "Connect Supabase first to enable contact messages.";
    return;
  }

  const name = document.getElementById("contactName").value.trim();
  const email = document.getElementById("contactEmail").value.trim();
  const message = document.getElementById("contactText").value.trim();

  const { error } = await supabaseClient.from("contact_messages").insert({
    name, email, message
  });

  if (error) {
    console.error(error);
    contactMessage.textContent = "Message could not be sent. Please try again.";
    return;
  }

  contactForm.reset();
  contactMessage.textContent = "Message sent. Thank you for reaching out.";
  setTimeout(() => contactMessage.textContent = "", 5000);
});

thoughtList.addEventListener("click", async (e) => {
  const button = e.target.closest(".community-like");
  if (!button || !supabaseClient) return;

  const id = button.dataset.id;
  button.disabled = true;

  const { data, error } = await supabaseClient.rpc("like_thought", { thought_id: id });
  if (error) {
    console.error(error);
    button.disabled = false;
    return;
  }

  button.innerHTML = `♥ <span>${data}</span>`;
});

document.querySelectorAll(".like-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    const liked = btn.dataset.liked === "true";
    btn.dataset.liked = String(!liked);
    btn.innerHTML = liked ? "♡ <span>Like</span>" : "♥ <span>Liked</span>";
  });
});

themeToggle.addEventListener("click", () => {
  document.body.classList.toggle("soft");
  themeToggle.textContent = document.body.classList.contains("soft") ? "☀" : "☾";
});

loadThoughts();
