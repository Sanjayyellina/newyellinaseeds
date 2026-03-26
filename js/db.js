// ============================================================
// SUPABASE CLIENT & DB FUNCTIONS
// ============================================================
"use strict";

const SUPABASE_URL = 'https://gnujlntvcdwtwdnsgobj.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdudWpsbnR2Y2R3dHdkbnNnb2JqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyOTQ4MTQsImV4cCI6MjA4ODg3MDgxNH0.34RcfWe6HknwHr_nTXjSPaHflqKanW-2JmckixlR06c';

// Initialize Supabase client
const dbClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// --- Fetch Functions ---

/**
 * Fetches all bins from the 'bins' table, ordered by ID.
 * @returns {Promise<Array<Object>|null>} Array of bin objects or null on error.
 */
async function dbFetchBins() {
  try {
    const { data, error } = await dbClient.from('bins').select('*').order('id', { ascending: true });
    if (error) throw error;
    return data;
  } catch (err) {
    console.error('Error fetching bins:', err);
    if (typeof showToast === 'function') showToast('Failed to fetch bins from database.', 'error');
    return null;
  }
}

/**
 * Fetches all intake records from the 'intakes' table, ordered by creation date descending.
 * @returns {Promise<Array<Object>|null>} Array of intake objects or null on error.
 */
async function dbFetchIntakes() {
  try {
    const { data, error } = await dbClient
      .from('intakes')
      .select('*, intake_allocations(bin_id)')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  } catch (err) {
    console.error('Error fetching intakes:', err);
    return null;
  }
}

/**
 * Fetches all dispatch records from the 'dispatches' table, ordered by creation date descending.
 * @returns {Promise<Array<Object>|null>} Array of dispatch objects or null on error.
 */
async function dbFetchDispatches() {
  try {
    const { data, error } = await dbClient.from('dispatches').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  } catch (err) {
    console.error('Error fetching dispatches:', err);
    return null;
  }
}

/**
 * Fetches all maintenance logs from the 'maintenance_logs' table, ordered by date descending.
 * @returns {Promise<Array<Object>|null>} Array of maintenance log objects or null on error.
 */
async function dbFetchMaintenance() {
  try {
    const { data, error } = await dbClient.from('maintenance_logs').select('*').order('date', { ascending: false });
    if (error) throw error;
    return data;
  } catch (err) {
    console.error('Error fetching maintenance:', err);
    return null;
  }
}

/**
 * Fetches all labor logs from the 'labor_logs' table, ordered by date descending.
 * @returns {Promise<Array<Object>|null>} Array of labor log objects or null on error.
 */
async function dbFetchLabor() {
  try {
    const { data, error } = await dbClient.from('labor_logs').select('*').order('date', { ascending: false });
    if (error) throw error;
    return data;
  } catch (err) {
    console.error('Error fetching labor:', err);
    return null;
  }
}

// --- Mutation Functions ---

async function dbUpdateBin(id, updates) {
  if (!navigator.onLine) {
    _enqueue({ type: 'UPDATE_BIN', id, updates });
    if (typeof showToast === 'function') showToast('Offline — bin update queued', 'info');
    return true;
  }
  try {
    const { error } = await dbClient.from('bins').update(updates).eq('id', id);
    if (error) throw error;
    return true;
  } catch (err) {
    console.error(`Error updating bin ${id}:`, err);
    if (typeof showToast === 'function') showToast(`Failed to update bin: ${err.message}`, 'error');
    return false;
  }
}

async function dbInsertIntake(intake, allocations = []) {
  if (!navigator.onLine) {
    _enqueue({ type: 'INSERT_INTAKE', intake, allocations });
    if (typeof showToast === 'function') showToast('Offline — intake queued for sync', 'info');
    return true;
  }
  try {
    const { error: intakeError } = await dbClient.from('intakes').insert([intake]);
    if (intakeError) throw intakeError;
    if (allocations && allocations.length > 0) {
      const { error: allocError } = await dbClient.from('intake_allocations').insert(allocations);
      if (allocError) throw allocError;
    }
    return true;
  } catch (err) {
    console.error('Error inserting intake:', err);
    if (typeof showToast === 'function') showToast(`DB Error: ${err.message}`, 'error');
    return false;
  }
}

async function dbInsertDispatch(dispatch) {
  if (!navigator.onLine) {
    _enqueue({ type: 'INSERT_DISPATCH', dispatch });
    if (typeof showToast === 'function') showToast('Offline — dispatch queued for sync', 'info');
    return true;
  }
  try {
    const { error } = await dbClient.from('dispatches').insert([dispatch]);
    if (error) throw error;
    return true;
  } catch (err) {
    console.error('Error inserting dispatch:', err);
    if (typeof showToast === 'function') showToast(`Failed to save dispatch: ${err.message}`, 'error');
    return false;
  }
}

async function dbInsertMaintenance(record) {
  try {
    const { data, error } = await dbClient.from('maintenance_logs').insert([record]).select().single();
    if (error) throw error;
    return data;
  } catch (err) {
    console.error('Error inserting maintenance record:', err);
    if (typeof showToast === 'function') showToast(`Failed to save maintenance: ${err.message}`, 'error');
    return false;
  }
}

async function dbInsertLabor(record) {
  try {
    const { data, error } = await dbClient.from('labor_logs').insert([record]).select().single();
    if (error) throw error;
    return data;
  } catch (err) {
    console.error('Error inserting labor record:', err);
    if (typeof showToast === 'function') showToast(`Failed to save labor: ${err.message}`, 'error');
    return false;
  }
}

async function dbInsertBinHistory(record) {
  try {
    const { error } = await dbClient.from('bin_history').insert([record]);
    if (error) throw error;
    return true;
  } catch (err) {
    console.error('Error inserting bin history:', err);
    return false;
  }
}

async function dbFetchBinHistory() {
  try {
    const { data, error } = await dbClient.from('bin_history').select('*').order('emptied_at', { ascending: false });
    if (error) throw error;
    return data;
  } catch (err) {
    console.error('Error fetching bin history:', err);
    return null;
  }
}

// ============================================================
// OFFLINE QUEUE — stores pending writes when offline
// ============================================================
const OFFLINE_QUEUE_KEY = 'yellina_offline_queue';

function _getQueue() {
  try { return JSON.parse(localStorage.getItem(OFFLINE_QUEUE_KEY) || '[]'); } catch { return []; }
}
function _saveQueue(q) {
  localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(q));
  _updateSyncBadge(q.length);
}
function _enqueue(op) {
  const q = _getQueue();
  q.push({ ...op, ts: Date.now() });
  _saveQueue(q);
  const cnt = document.getElementById('offline-queue-count');
  if (cnt) { cnt.textContent = `${q.length} pending`; cnt.style.display = 'inline'; }
}
function _updateSyncBadge(count) {
  const badge = document.getElementById('sync-badge');
  if (!badge) return;
  if (count > 0) {
    badge.textContent = `⟳ ${count} change${count>1?'s':''} pending sync`;
    badge.classList.add('visible');
  } else {
    badge.classList.remove('visible');
    const cnt = document.getElementById('offline-queue-count');
    if (cnt) cnt.style.display = 'none';
  }
}

async function syncOfflineQueue() {
  const queue = _getQueue();
  if (!queue.length || !navigator.onLine) return;

  const failed = [];
  for (const op of queue) {
    try {
      if (op.type === 'UPDATE_BIN')        await dbUpdateBin(op.id, op.updates);
      else if (op.type === 'INSERT_INTAKE') await dbInsertIntake(op.intake, op.allocations);
      else if (op.type === 'INSERT_DISPATCH') await dbInsertDispatch(op.dispatch);
      else if (op.type === 'INSERT_MAINTENANCE') await dbInsertMaintenance(op.record);
      else if (op.type === 'INSERT_LABOR')  await dbInsertLabor(op.record);
      else if (op.type === 'INSERT_BIN_HISTORY') await dbInsertBinHistory(op.record);
    } catch { failed.push(op); }
  }

  _saveQueue(failed);
  const synced = queue.length - failed.length;
  if (synced > 0) {
    if (typeof showToast === 'function') showToast(`Synced ${synced} offline operation${synced>1?'s':''}`, 'success');
    if (typeof bootApp === 'function') await bootApp();
  }
}

// Expose for the online event handler in index.html
window.syncOfflineQueue = syncOfflineQueue;
// Check on load for any pending queue
window.addEventListener('load', () => {
  const q = _getQueue();
  if (q.length > 0) _updateSyncBadge(q.length);
});

// Helper to log activities (for Analytics / Export)
async function dbLogActivity(action_type, description) {
  try {
    const { error } = await dbClient.from('activity_logs').insert([{ action_type, description }]);
    if (error) throw error;
    return true;
  } catch (err) {
    console.error('Error logging activity:', err);
    return false;
  }
}

// ============================================================
// AUTHENTICATION FUNCTIONS
// ============================================================

async function dbLogin(email, password) {
  try {
    const { data, error } = await dbClient.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return true;
  } catch(err) {
    console.error('Login error:', err);
    if(typeof toast === 'function') toast(err.message, 'error');
    const errEl = document.getElementById('login-error');
    if(errEl) { errEl.textContent = err.message; errEl.style.display = 'block'; }
    return false;
  }
}

async function dbLogout() {
  try {
    const { error } = await dbClient.auth.signOut();
    if(error) throw error;
    if(window.Store) window.Store.reset();
    window.location.reload();
  } catch(err) {
    console.error('Logout error:', err);
    if(typeof toast === 'function') toast('Failed to log out.', 'error');
  }
}

// Global functions for the HTML buttons
window.doLogin = async function() {
  const email = document.getElementById('login-email').value;
  const pass = document.getElementById('login-password').value;
  const btn = document.getElementById('login-btn');
  const errEl = document.getElementById('login-error');
  
  if(errEl) errEl.style.display = 'none';
  if(!email || !pass) {
    if(errEl) { errEl.textContent = 'Please enter both email and password.'; errEl.style.display = 'block'; }
    return;
  }
  
  if(btn) {
    btn.innerText = 'Signing in...';
    btn.disabled = true;
  }
  
  const success = await dbLogin(email, pass);
  if (success) {
    if(typeof bootApp === 'function') bootApp();
  } else {
    if(btn) {
      btn.innerText = 'Sign In';
      btn.disabled = false;
    }
  }
}

window.doLogout = function() {
  dbLogout();
}
