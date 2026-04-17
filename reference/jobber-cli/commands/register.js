/**
 * Purpose: Command Registry - manages command registration and discovery for extensibility
 * Inputs: Command name and class mappings
 * Outputs: Command registry object with getCommand method
 * Dependencies: All command classes (StatusCommand, SchemaCommand, etc.)
 */

import StatusCommand from './status.js';
import SchemaCommand from './schema.js';
import SearchCommand from './search.js';
import GetCommand from './get.js';
import QueryCommand from './query.js';
import TokenCommand from './token.js';
import CReportCommand from './creport.js';
import SearchPPCommand from './searchpp.js';
import NotesCommand from './notes.js';
import TestApiCommand from './test-api.js';
import MapSchemaCommand from './map-schema.js';
import TestComprehensiveCommand from './test-comprehensive.js';
import AnalyzeLineItemsCommand from './analyze-line-items.js';
import ListARJobsCommand from './list-ar-jobs.js';
import SortJobsCommand from './sort-jobs.js';
import BatchHTMLReportCommand from './batch-html-report.js';
import ClientReportCommand from './client-report.js';
import VisitsReportCommand from './visits-report.js';
import ExitCommand from './exit.js';
import DoctorCommand from './doctor.js';
import JobNoteCommand from './job-note.js';
import JobExpenseCommand from './job-expense.js';

// Built-in commands
const commands = {
  status: StatusCommand,
  schema: SchemaCommand,
  search: SearchCommand,
  searchpp: SearchPPCommand,
  get: GetCommand,
  query: QueryCommand,
  token: TokenCommand,
  creport: CReportCommand,
  notes: NotesCommand,
  'test-api': TestApiCommand,
  'map-schema': MapSchemaCommand,
  'test-comprehensive': TestComprehensiveCommand,
  'analyze-line-items': AnalyzeLineItemsCommand,
  'list-ar': ListARJobsCommand,
  'sort-jobs': SortJobsCommand,
  'batch-html-report': BatchHTMLReportCommand,
  batch: BatchHTMLReportCommand,  // Alias
  'client-report': ClientReportCommand,
  cr: ClientReportCommand,  // Alias for quick access
  'visits-report': VisitsReportCommand,
  doctor: DoctorCommand,
  'job-note': JobNoteCommand,
  'job-expense': JobExpenseCommand,
  exit: ExitCommand,
  quit: ExitCommand  // Alias
};

// Plugin commands (loaded dynamically)
const plugins = {};

/**
 * Register a command
 */
export function registerCommand(name, CommandClass) {
  commands[name] = CommandClass;
}

/**
 * Register a plugin
 */
export function registerPlugin(name, plugin) {
  plugins[name] = plugin;
  if (plugin.commands) {
    Object.entries(plugin.commands).forEach(([cmdName, CommandClass]) => {
      registerCommand(cmdName, CommandClass);
    });
  }
}

/**
 * Get command class by name
 */
export function getCommand(name) {
  return commands[name] || null;
}

/**
 * Get all registered command names
 */
export function listCommands() {
  return Object.keys(commands);
}

/**
 * Check if command exists
 */
export function hasCommand(name) {
  return name in commands;
}

export default {
  registerCommand,
  registerPlugin,
  getCommand,
  listCommands,
  hasCommand,
  commands,
  plugins
};
