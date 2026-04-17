# Plugin Development Guide

This directory is for extending the Jobber CLI with custom commands and functionality.

## Creating a Plugin

1. **Create a plugin directory:**
   ```
   plugins/my-plugin/
   ├── index.js
   └── README.md
   ```

2. **Export plugin definition:**
   ```javascript
   import { BaseCommand } from '../../commands/_base.js';

   class MyCustomCommand extends BaseCommand {
     async run(args) {
       await this.initialize();
       // Your command logic here
       // Automatic rate limiting and error handling included!
     }
   }

   export default {
     name: 'my-plugin',
     description: 'My custom plugin',
     commands: {
       'my-command': MyCustomCommand
     }
   };
   ```

3. **The plugin system will automatically:**
   - Load your plugin
   - Register commands
   - Provide rate limiting
   - Include error recovery
   - Enable schema help

## Plugin Structure

- **name**: Plugin identifier
- **description**: Plugin description
- **commands**: Object mapping command names to command classes
- **dependencies**: (Optional) Array of required dependencies

## Benefits

- All commands inherit from `BaseCommand`
- Automatic throttle management
- Schema integration for error recovery
- Consistent error handling
- Structured output formatting

## Example

See `examples/` directory for example implementations.
