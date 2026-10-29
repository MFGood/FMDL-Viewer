// save-team.js — the open export's team in the loaded save file. The export's team name (the "Team:" line of
// its note) is looked up among the save's teams; if it isn't there, or more than one team has it, the note's
// "ID:" line is tried, then a team ID the user gives (remembered for that team name). Linked players show
// their names from the save, and their body shape and skin color are the save's, edited in place.

import { state } from '../core/state.js';

// Team IDs given for export team names, remembered in the browser: { team name: ID }.
const STORAGE_KEY = 'saveTeamIds';
const remembered = () => { try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') || {}; } catch { return {}; } };

const norm = (name) => (name || '').trim().toLowerCase();

/** The save's teams with names. */
const namedTeams = () => Object.values(state.save?.parsed.teams || {}).filter((team) => team.name && team.id != null);

/** The save's team with this ID, or null. */
export const saveTeam = (id) => namedTeams().find((team) => String(team.id) === String(id).trim()) || null;

/** PES 15–17 saves go with Pre-Fox (.model) exports, PES 18–21 saves with Fox (.fmdl) ones. */
export const preFoxSave = () => parseInt(state.save.parsed.pes) < 18;

/** Whether the open export's player models are Pre-Fox (true), Fox (false), or neither or both (null). */
function preFoxExport() {
  const models = (state.aet?.players || []).flatMap((p) => p.fmdls);
  const preFox = models.some((p) => /\.model$/i.test(p)), fox = models.some((p) => /\.fmdl$/i.test(p));
  return preFox === fox ? null : preFox;
}

/**
 * Link the open export with a team in the save: { team } when found, { unmatched: true } when the user needs
 * to give a team ID, { wrongVersion: true } when the save is for the other generation of PES (Pre-Fox or Fox)
 * than the export's models, null without both an export and a save. Sets state.saveLink and the players' names.
 */
export function linkSaveTeam() {
  const { aet, save } = state;
  if (!aet || !save) return setLink(null);
  const preFox = preFoxExport();
  if (preFox != null && preFox !== preFoxSave()) return setLink({ wrongVersion: true });
  const name = norm(aet.teamName);
  const byName = name ? namedTeams().filter((team) => norm(team.name) === name || norm(team.short_name) === name) : [];
  if (byName.length === 1) return setLink({ team: byName[0] });
  const given = (name && saveTeam(remembered()[name] ?? '')) || (aet.teamId && saveTeam(aet.teamId));
  return setLink(given ? { team: given } : { unmatched: true, ambiguous: byName.length > 1 });
}

/** Link the export with the save's team of this ID. False if the save has no such team. */
export function useTeamId(id) {
  const team = saveTeam(id);
  if (!team) return false;
  const name = norm(state.aet?.teamName);
  if (name) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...remembered(), [name]: team.id })); } catch {}
  }
  setLink({ team });
  return true;
}

/** A save player's name without the color codes PES names can hold (0x11, "c", RRGGBBAA). */
export const plainName = (name) => (name || '').replace(/\x11c[0-9a-f]{8}/gi, '').trim();

function setLink(link) {
  state.saveLink = link;
  for (const player of state.aet?.players || []) {
    player.exportName === undefined && (player.exportName = player.name);
    const own = savePlayerOf(player);
    player.name = (own && plainName(own.name)) || player.exportName;
  }
  return link;
}

/**
 * A save player's skin color as the viewer numbers it: 1–6 as in the game, 7 custom; null when unset (0).
 * PES 18 on has no custom skin, so the reader loads a stored 7 as 0 with b_changed.
 */
export function skinFromSave(savePlayer) {
  const n = savePlayer.b_changed && !savePlayer.skin_col ? 7 : savePlayer.skin_col;
  return n >= 1 && n <= 7 ? n : null;
}

/** Set a save player's skin color (1–7), the way the reader would have loaded it. */
export function skinToSave(savePlayer, n) {
  const custom = n === 7 && parseInt(state.save.parsed.pes) >= 18;
  savePlayer.skin_col = custom ? 0 : n;
  if (custom) savePlayer.b_changed = true;
  else delete savePlayer.b_changed;
}

/**
 * The save's player for an export player: the export's number nn is player ID team ID × 100 + nn, as PES
 * numbers a team's own players; failing that, the nn-th player on the team's roster. Null if not linked.
 */
export function savePlayerOf(player) {
  const team = state.saveLink?.team, players = state.save?.parsed.players;
  if (!team || !players || player?.number == null) return null;
  return players[team.id * 100 + player.number] || players[team.players?.[player.number - 1]] || null;
}
