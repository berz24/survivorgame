// leaderboard.js
// Firestore-based leaderboard for Borderline Survival Game
// IMPORTANT: Replace firebaseConfig with your Firebase project's config object.

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  // ...other fields from Firebase Console
};

(function() {
  // Init Firebase (compat)
  if (!window.firebase || !firebase.apps) {
    console.error('Firebase SDK not loaded. Make sure firebase-app-compat.js is included.');
    return;
  }
  if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
  }
  const db = firebase.firestore();

  // Submit a score
  async function submitScore(name, score) {
    if (!name) name = 'Anon';
    if (!score && score !== 0) return;
    const doc = {
      name: String(name).slice(0, 20),
      score: Number(score),
      ts: firebase.firestore.FieldValue.serverTimestamp()
    };
    try {
      await db.collection('scores').add(doc);
      await refreshLeaderboard();
    } catch (err) {
      console.error('Failed to submit score', err);
      alert('Failed to submit score. Check console for details.');
    }
  }

  // Get top scores
  async function getTopScores(limit = 10) {
    try {
      const snapshot = await db.collection('scores')
        .orderBy('score', 'desc')
        .limit(limit)
        .get();
      return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (err) {
      console.error('Failed to fetch scores', err);
      return [];
    }
  }

  // Render leaderboard
  async function refreshLeaderboard() {
    const list = document.getElementById('scoresList');
    if (!list) return;
    list.innerHTML = '<li>Loading...</li>';
    const top = await getTopScores(10);
    list.innerHTML = '';
    if (!top.length) {
      list.innerHTML = '<li>No scores yet</li>';
      return;
    }
    top.forEach(s => {
      const li = document.createElement('li');
      const time = s.ts && s.ts.toDate ? s.ts.toDate().toLocaleString() : '';
      li.textContent = `${s.name} — ${s.score}${time ? ' (' + time + ')' : ''}`;
      list.appendChild(li);
    });
  }

  // Wire UI after DOM ready
  document.addEventListener('DOMContentLoaded', () => {
    const submitBtn = document.getElementById('submitScoreBtn');
    const nameInput = document.getElementById('playerName');
    const scoreInput = document.getElementById('playerScore');

    if (submitBtn) {
      submitBtn.addEventListener('click', async () => {
        const name = nameInput ? nameInput.value || 'Anon' : 'Anon';
        const score = scoreInput ? Number(scoreInput.value || 0) : 0;
        await submitScore(name, score);
        if (scoreInput) scoreInput.value = '';
      });
    }

    // Initial load
    refreshLeaderboard();
  });

})();
