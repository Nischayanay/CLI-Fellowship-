# PBCLI UX Polish Documentation

Complete guide to PBCLI's world-class user experience features.

## Overview

PBCLI implements industry-leading UX patterns inspired by Stripe CLI, Vercel CLI, and Supabase CLI, with behavioral psychology principles for habit formation and developer delight.

## Features

### 1. Auto-Suggestions ("Did you mean?")

When you mistype a command, PBCLI suggests corrections using Levenshtein distance algorithm.

**Example:**
```bash
$ pb enhnce "my prompt"

Command not found: enhnce

Did you mean: enhance?

Run pb --help to see all commands
```

**How it works:**
- Calculates similarity score between input and all available commands
- Shows top 3 suggestions if similarity >= 60%
- Uses intelligent string distance matching

**Implementation:**
- `src/utils/suggestions.ts` - Suggestion engine
- Levenshtein distance algorithm
- Configurable similarity threshold

### 2. Rich Help Pages

Every command includes comprehensive help with examples, options, and related commands.

**Features:**
- Command purpose (1-line description)
- Usage examples with real scenarios
- Options table with descriptions
- Related commands for discovery

**Example:**
```bash
$ pb enhance --help

Enhance a prompt using the Context Engine

USAGE
  $ pb enhance [PROMPT]

OPTIONS
  --fast          Enable fast mode
  --budget        Budget mode (low|medium|high)
  --template      Specify template name
  --json          Output in JSON format

EXAMPLES
  $ pb enhance "write a function to sort an array"
  $ pb enhance "create a React component" --template react
  $ pb enhance "optimize this code" --fast

RELATED COMMANDS
  pb devsync      Get coding context
  pb init         Initialize project
  pb lib          Manage templates
```

### 3. Smart Error Messages

Errors include context, fix suggestions, documentation links, and error codes.

**Format:**
```
[ERROR pb-401] Your session expired

Fix: Run pb login to authenticate again

Docs: https://promptbrain.io/docs/authentication
```

**Error Codes:**
- `pb-401` - Authentication error
- `pb-403` - Permission denied
- `pb-404` - Resource not found
- `pb-429` - Rate limit exceeded
- `pb-500` - Server error
- `pb-network` - Network error

**Features:**
- Contextual explanation
- Actionable fix suggestion
- Documentation link
- Debug-friendly error code
- Non-hostile tone

### 4. User Onboarding Flow

First-time users see a welcoming onboarding experience.

**Flow:**
1. **Welcome Message** - ASCII sigil + greeting
2. **Step 1: Authentication** - Login options
3. **Step 2: Link Tools** - Optional tool connections
4. **Step 3: Initialize Project** - Project setup
5. **Step 4: Start Using** - Command examples
6. **Quick Tips** - Essential commands
7. **Documentation Links** - Help resources

**Trigger:**
- Runs automatically on first command
- Can be skipped
- Marked as completed after viewing

**Implementation:**
- `src/lib/onboarding.ts` - Onboarding system
- State stored in `~/.pb/onboarding.json`
- Beautiful branded output

### 5. Intelligent Tips

Contextual tips and reinforcement metrics after commands.

**Enhancement Metrics:**
```
✨ Enhancement Insights

  ✓ 3 Memory Nodes Used
  ✓ Token Savings: 63%
  ✓ Source: Notion + Cursor
  ⏱  Processed in 245ms
```

**Features:**
- Memory node usage
- Token savings percentage
- Cross-app context sources
- Processing time
- Celebration for high savings

**Contextual Tips:**
- Command-specific suggestions
- First-time usage tips
- Upgrade suggestions for free users
- Best practice recommendations

**Implementation:**
- `src/utils/tips.ts` - Tips system
- Metrics from API responses
- Behavioral reinforcement

### 6. Color Psychology

Official PromptBrain palette for optimal developer experience.

**Colors:**
- **Soft Cyan (#38C9D6)** - Primary actions, important info
- **Mint Green (#33E0A1)** - Success, progress, positive reinforcement
- **Amber (#F5C04D)** - Warnings (non-threatening)
- **Soft Red (#E65C5C)** - Errors (non-hostile)
- **Stone Grey (#9BA3AF)** - Metadata, secondary info
- **White** - Neutral text

**Principles:**
- Calm and safe
- Addictive and dopamine-reinforcing
- Psychologically optimized
- Accessible (color-blind mode available)

**Implementation:**
- `src/utils/colors.ts` - Color system
- Consistent across all commands
- Graceful fallback for no-color terminals

## Behavioral Psychology

### Habit Formation

**Positive Reinforcement:**
- Show token savings after each enhancement
- Celebrate high efficiency (>70% savings)
- Display memory graph hits
- Highlight cross-app context usage

**Progress Visibility:**
- Smooth progress indicators
- Clear completion messages
- Milestone celebrations

**Reward Loops:**
- Immediate feedback
- Quantified improvements
- Social proof (tool connections)

### Trust Building

**Transparency:**
- Show what PBCLI is doing
- Explain decisions
- Display processing time

**Safety:**
- Non-hostile error messages
- Clear fix suggestions
- Safe defaults

**Predictability:**
- Consistent patterns
- Expected behaviors
- Reliable performance

## Command-Specific UX

### pb enhance

**Before:**
```bash
$ pb enhance "my prompt"
Enhancing...
Done.
```

**After:**
```bash
$ pb enhance "my prompt"

⠋ Orchestrating enhancement...

🔍 Task Detected: code_generation (confidence: 87%)
   💡 Detected coding task with specific requirements

🤖 Model Selected: gpt-4
   🎯 High complexity task requires advanced model

📝 Template Applied: code-generation
   📋 Using optimized template for code tasks

⏱️  Processing Time: 245ms

✓ Prompt Enhanced!

Original:
my prompt

Enhanced:
[Enhanced version with context]

────────────────────────────────────────────────────────────────────────────────

✨ Enhancement Insights

  ✓ 3 Memory Nodes Used
  ✓ Token Savings: 63%
  ✓ Source: Notion + Cursor

────────────────────────────────────────────────────────────────────────────────
```

### pb init

**Features:**
- Auto-detects frameworks
- Shows project structure
- Displays next steps
- Contextual tips

**Output:**
```bash
$ pb init

🚀 Initializing PromptBrain

✓ Project initialized successfully!

Project Detection Results

Project Type:     Next.js Application
Frameworks:       Next.js, React, Tailwind CSS
Package Manager:  npm
TypeScript:       Yes
Dependencies:     42 packages

────────────────────────────────────────────────────────────────────────────────

✓ Created .promptbrain/ directory
✓ Saved project configuration
✓ Detected frameworks and dependencies
✓ Optimized templates for your stack

Tip: PBCLI auto-detected your frameworks and dependencies

Next Steps

  1. pb enhance "your prompt" - Try framework-aware enhancements
  2. pb devsync - Get context for your current task
  3. pb link - Connect external tools
```

### pb doctor

**Features:**
- Comprehensive health checks
- Actionable suggestions
- Clear status indicators
- Overall health summary

**Output:**
```bash
$ pb doctor

🏥 PBCLI Health Check

Running diagnostics...

✓ Authentication
  Logged in as user@example.com (23h remaining)

✓ API Connectivity
  Connected to PromptBrain API

✓ Configuration
  Configuration is valid

✓ Version
  PBCLI v0.1.0

────────────────────────────────────────────────────────────────────────────────

✓ All systems healthy! 🎉
Tip: PBCLI is ready to use.
```

## JSON Mode

All commands support `--json` flag for automation.

**Example:**
```bash
$ pb init --json
{
  "status": "success",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "data": {
    "initialized": true,
    "projectInfo": {
      "frameworks": ["Next.js", "React"],
      "projectType": "Next.js Application",
      "hasTypeScript": true
    }
  }
}
```

**Features:**
- Valid JSON output
- No ANSI codes
- Consistent schema
- Error handling

## Accessibility

### Color-Blind Mode

Enable with:
```bash
pb config set ui.colorBlindMode true
```

**Features:**
- Text-based indicators (✓, ✗, ⚠)
- Symbols in addition to colors
- Full functionality preserved

### Plain Text Fallback

Automatically detected for:
- Non-TTY terminals
- CI/CD environments
- Piped output

## Best Practices

### For Users

1. **Run onboarding** - See it once for overview
2. **Use --help** - Every command has rich help
3. **Enable JSON mode** - For automation scripts
4. **Check doctor** - Diagnose issues quickly
5. **Read tips** - Learn best practices

### For Developers

1. **Consistent colors** - Use color system
2. **Progress indicators** - Show what's happening
3. **Error handling** - Helpful, not hostile
4. **JSON support** - Add --json to all commands
5. **Tips and metrics** - Reinforce positive behavior

## Implementation Details

### File Structure

```
src/
├── utils/
│   ├── colors.ts          # Color system
│   ├── ui.ts              # UI formatter
│   ├── progress.ts        # Progress indicators
│   ├── suggestions.ts     # Command suggestions
│   ├── tips.ts            # Intelligent tips
│   └── reinforcement.ts   # Behavioral reinforcement
├── lib/
│   └── onboarding.ts      # Onboarding system
└── commands/
    └── *.ts               # All commands use UX system
```

### Key Modules

**colors.ts** - Color psychology system
- Official palette
- Semantic helpers
- Color-blind mode
- Fallback support

**suggestions.ts** - Command suggestions
- Levenshtein distance
- Similarity scoring
- Top 3 suggestions
- Related commands

**tips.ts** - Intelligent tips
- Enhancement metrics
- Contextual tips
- Celebrations
- Upgrade suggestions

**onboarding.ts** - First-run experience
- Welcome flow
- Step-by-step guide
- Quick start tips
- State management

## Metrics

### User Engagement

- **Onboarding completion**: Track first-run experience
- **Command usage**: Most popular commands
- **Error rates**: Track and improve
- **Tip effectiveness**: Which tips are helpful

### Performance

- **Response time**: <500ms for most commands
- **Progress updates**: 80ms intervals
- **Memory usage**: Minimal footprint
- **Startup time**: <100ms

## Future Enhancements

1. **Interactive Mode** - TUI for complex workflows
2. **Command History** - Smart command suggestions
3. **Autocomplete** - Shell completion scripts
4. **Themes** - User-customizable colors
5. **Localization** - Multi-language support
6. **Voice Feedback** - Audio cues (optional)
7. **Animations** - Smooth transitions
8. **Tutorials** - Interactive learning

## Support

- **Documentation**: https://promptbrain.io/docs
- **Discord**: https://discord.gg/promptbrain
- **Issues**: https://github.com/promptbrain/cli/issues

## References

- [Stripe CLI UX](https://stripe.com/docs/cli)
- [Vercel CLI Design](https://vercel.com/docs/cli)
- [Supabase CLI](https://supabase.com/docs/guides/cli)
- [Color Psychology](https://www.interaction-design.org/literature/article/color-psychology)
- [Behavioral Design](https://www.behavioraleconomics.com/resources/mini-encyclopedia-of-be/behavioral-design/)
