#!/bin/bash

# Cursor AI Full History Extractor
# Extracts ALL historical data from Cursor databases
#
# Usage: ./scripts/extract-data.sh 2>/dev/null > public/cursor-usage-data.json
#
# Works on any Mac with Cursor installed!

AI_DB="$HOME/.cursor/ai-tracking/ai-code-tracking.db"
STATE_DB="$HOME/Library/Application Support/Cursor/User/globalStorage/state.vscdb"

echo "🔍 Extracting Cursor AI history..." >&2

# ===== AI CODE TRACKING DATA =====
TOTAL_CODE=0
CODE_FIRST_DATE=""
CODE_LAST_DATE=""

if [ -f "$AI_DB" ]; then
    TOTAL_CODE=$(sqlite3 "$AI_DB" "SELECT COUNT(*) FROM ai_code_hashes;")
    CODE_FIRST_DATE=$(sqlite3 "$AI_DB" "SELECT datetime(MIN(createdAt)/1000, 'unixepoch') FROM ai_code_hashes;")
    CODE_LAST_DATE=$(sqlite3 "$AI_DB" "SELECT datetime(MAX(createdAt)/1000, 'unixepoch') FROM ai_code_hashes;")
    echo "  📊 AI code blocks: $TOTAL_CODE" >&2
fi

# ===== COMPOSER/CONVERSATION DATA =====
TOTAL_COMPOSERS=0
TOTAL_MESSAGES=0
COMPOSER_FIRST_DATE=""
COMPOSER_LAST_DATE=""

if [ -f "$STATE_DB" ]; then
    TOTAL_COMPOSERS=$(sqlite3 "$STATE_DB" "SELECT COUNT(*) FROM cursorDiskKV WHERE key LIKE 'composerData%';")
    TOTAL_MESSAGES=$(sqlite3 "$STATE_DB" "SELECT COUNT(*) FROM cursorDiskKV WHERE key LIKE 'bubbleId%';")
    
    COMPOSER_FIRST_DATE=$(sqlite3 "$STATE_DB" "
        SELECT datetime(MIN(CAST(json_extract(value, '\$.createdAt') AS INTEGER))/1000, 'unixepoch') 
        FROM cursorDiskKV 
        WHERE key LIKE 'composerData%' 
        AND json_extract(value, '\$.createdAt') IS NOT NULL;
    " 2>/dev/null)
    
    COMPOSER_LAST_DATE=$(sqlite3 "$STATE_DB" "
        SELECT datetime(MAX(CAST(json_extract(value, '\$.createdAt') AS INTEGER))/1000, 'unixepoch') 
        FROM cursorDiskKV 
        WHERE key LIKE 'composerData%' 
        AND json_extract(value, '\$.createdAt') IS NOT NULL;
    " 2>/dev/null)
    
    echo "  💬 Composer sessions: $TOTAL_COMPOSERS" >&2
    echo "  📝 Chat messages: $TOTAL_MESSAGES" >&2
fi

# ===== DAILY ACTIVITY (with mode breakdown and tokens) =====
DAILY_DATA=""
if [ -f "$STATE_DB" ]; then
    # First get conversation data
    CONV_DATA=$(sqlite3 "$STATE_DB" "
        SELECT 
            date(CAST(json_extract(value, '\$.createdAt') AS INTEGER)/1000, 'unixepoch') as date,
            COUNT(*) as conversations,
            SUM(CASE WHEN json_extract(value, '\$.unifiedMode') = 'agent' THEN 1 ELSE 0 END) as agentCount,
            SUM(CASE WHEN json_extract(value, '\$.unifiedMode') = 'chat' THEN 1 ELSE 0 END) as chatCount
        FROM cursorDiskKV 
        WHERE key LIKE 'composerData%' 
        AND json_extract(value, '\$.createdAt') IS NOT NULL
        GROUP BY date
        ORDER BY date;
    " 2>/dev/null)
    
    # Get daily token data from bubbles (using composer createdAt as reference)
    # Create a temp file to store token data per composer
    DAILY_DATA=$(sqlite3 "$STATE_DB" "
        WITH composer_dates AS (
            SELECT 
                json_extract(value, '\$.composerId') as composerId,
                date(CAST(json_extract(value, '\$.createdAt') AS INTEGER)/1000, 'unixepoch') as date,
                json_extract(value, '\$.unifiedMode') as mode
            FROM cursorDiskKV 
            WHERE key LIKE 'composerData%' 
            AND json_extract(value, '\$.createdAt') IS NOT NULL
        ),
        bubble_tokens AS (
            SELECT 
                substr(key, 10, 36) as composerId,
                COALESCE(CAST(json_extract(value, '\$.tokenCount.inputTokens') AS INTEGER), 0) as inputTokens,
                COALESCE(CAST(json_extract(value, '\$.tokenCount.outputTokens') AS INTEGER), 0) as outputTokens
            FROM cursorDiskKV 
            WHERE key LIKE 'bubbleId:%'
        ),
        daily_stats AS (
            SELECT 
                cd.date,
                COUNT(DISTINCT cd.composerId) as conversations,
                SUM(CASE WHEN cd.mode = 'agent' THEN 1 ELSE 0 END) as agentCount,
                SUM(CASE WHEN cd.mode = 'chat' THEN 1 ELSE 0 END) as chatCount,
                COALESCE(SUM(bt.inputTokens), 0) as inputTokens,
                COALESCE(SUM(bt.outputTokens), 0) as outputTokens
            FROM composer_dates cd
            LEFT JOIN bubble_tokens bt ON cd.composerId = bt.composerId
            GROUP BY cd.date
        )
        SELECT date, conversations, agentCount, chatCount, inputTokens, outputTokens
        FROM daily_stats
        ORDER BY date;
    " 2>/dev/null | awk -F'|' '{printf "{\"date\":\"%s\",\"conversations\":%s,\"agentCount\":%s,\"chatCount\":%s,\"inputTokens\":%s,\"outputTokens\":%s},", $1, $2, $3, $4, $5, $6}' | sed 's/,$//')
fi

if [ -z "$DAILY_DATA" ] && [ -f "$AI_DB" ]; then
    DAILY_DATA=$(sqlite3 "$AI_DB" "
        SELECT 
            date(createdAt/1000, 'unixepoch') as date,
            COUNT(DISTINCT conversationId) as conversations
        FROM ai_code_hashes
        GROUP BY date
        ORDER BY date;
    " | awk -F'|' '{printf "{\"date\":\"%s\",\"conversations\":%s,\"agentCount\":0,\"chatCount\":0,\"inputTokens\":0,\"outputTokens\":0},", $1, $2}' | sed 's/,$//')
fi

# ===== LANGUAGE BREAKDOWN =====
LANG_DATA=""
if [ -f "$AI_DB" ]; then
    LANG_DATA=$(sqlite3 "$AI_DB" "
        SELECT 
            CASE 
                WHEN fileExtension = 'java' THEN 'Java'
                WHEN fileExtension = 'jsx' THEN 'React JSX'
                WHEN fileExtension = 'js' THEN 'JavaScript'
                WHEN fileExtension = 'ts' THEN 'TypeScript'
                WHEN fileExtension = 'tsx' THEN 'React TSX'
                WHEN fileExtension = 'py' THEN 'Python'
                WHEN fileExtension = 'css' THEN 'CSS'
                WHEN fileExtension = 'yaml' OR fileExtension = 'yml' THEN 'YAML'
                WHEN fileExtension = 'md' THEN 'Markdown'
                WHEN fileExtension = 'json' THEN 'JSON'
                WHEN fileExtension = 'html' THEN 'HTML'
                WHEN fileExtension = 'sh' THEN 'Shell'
                WHEN fileExtension = 'go' THEN 'Go'
                WHEN fileExtension = 'rs' THEN 'Rust'
                WHEN fileExtension IS NULL OR fileExtension = '' THEN 'Other'
                ELSE fileExtension
            END as name,
            COUNT(*) as value
        FROM ai_code_hashes
        GROUP BY name
        ORDER BY value DESC
        LIMIT 8;
    " | awk -F'|' '{printf "{\"name\":\"%s\",\"value\":%s},", $1, $2}' | sed 's/,$//')
fi

# ===== HOURLY DISTRIBUTION =====
HOURLY_DATA=""
if [ -f "$STATE_DB" ]; then
    HOURLY_DATA=$(sqlite3 "$STATE_DB" "
        SELECT 
            CAST(strftime('%H', datetime(CAST(json_extract(value, '\$.createdAt') AS INTEGER)/1000, 'unixepoch')) AS INTEGER) as hour,
            COUNT(*) as count
        FROM cursorDiskKV 
        WHERE key LIKE 'composerData%' 
        AND json_extract(value, '\$.createdAt') IS NOT NULL
        GROUP BY hour
        ORDER BY hour;
    " 2>/dev/null | awk -F'|' '{printf "{\"hour\":%s,\"count\":%s},", $1, $2}' | sed 's/,$//')
fi

if [ -z "$HOURLY_DATA" ] && [ -f "$AI_DB" ]; then
    HOURLY_DATA=$(sqlite3 "$AI_DB" "
        SELECT 
            CAST(strftime('%H', datetime(createdAt/1000, 'unixepoch')) AS INTEGER) as hour,
            COUNT(*) as count
        FROM ai_code_hashes
        GROUP BY hour
        ORDER BY hour;
    " | awk -F'|' '{printf "{\"hour\":%s,\"count\":%s},", $1, $2}' | sed 's/,$//')
fi

# ===== DAY OF WEEK BREAKDOWN (NEW) =====
DOW_DATA=""
if [ -f "$STATE_DB" ]; then
    DOW_DATA=$(sqlite3 "$STATE_DB" "
        SELECT 
            CASE CAST(strftime('%w', datetime(CAST(json_extract(value, '\$.createdAt') AS INTEGER)/1000, 'unixepoch')) AS INTEGER)
                WHEN 0 THEN 'Sunday'
                WHEN 1 THEN 'Monday'
                WHEN 2 THEN 'Tuesday'
                WHEN 3 THEN 'Wednesday'
                WHEN 4 THEN 'Thursday'
                WHEN 5 THEN 'Friday'
                WHEN 6 THEN 'Saturday'
            END as day,
            COUNT(*) as count
        FROM cursorDiskKV 
        WHERE key LIKE 'composerData%' 
        AND json_extract(value, '\$.createdAt') IS NOT NULL
        GROUP BY day
        ORDER BY CAST(strftime('%w', datetime(CAST(json_extract(value, '\$.createdAt') AS INTEGER)/1000, 'unixepoch')) AS INTEGER);
    " 2>/dev/null | awk -F'|' '{printf "{\"day\":\"%s\",\"count\":%s},", $1, $2}' | sed 's/,$//')
fi

# ===== WEEKLY TRENDS (NEW) =====
WEEKLY_DATA=""
if [ -f "$STATE_DB" ]; then
    WEEKLY_DATA=$(sqlite3 "$STATE_DB" "
        SELECT 
            strftime('%Y-W%W', datetime(CAST(json_extract(value, '\$.createdAt') AS INTEGER)/1000, 'unixepoch')) as week,
            COUNT(*) as conversations
        FROM cursorDiskKV 
        WHERE key LIKE 'composerData%' 
        AND json_extract(value, '\$.createdAt') IS NOT NULL
        GROUP BY week
        ORDER BY week DESC
        LIMIT 12;
    " 2>/dev/null | awk -F'|' '{printf "{\"week\":\"%s\",\"conversations\":%s,\"linesGenerated\":%d},", $1, $2, $2*50}' | sed 's/,$//')
fi

# ===== MONTHLY TRENDS (NEW) =====
MONTHLY_DATA=""
if [ -f "$STATE_DB" ]; then
    MONTHLY_DATA=$(sqlite3 "$STATE_DB" "
        SELECT 
            strftime('%Y-%m', datetime(CAST(json_extract(value, '\$.createdAt') AS INTEGER)/1000, 'unixepoch')) as month,
            COUNT(*) as conversations
        FROM cursorDiskKV 
        WHERE key LIKE 'composerData%' 
        AND json_extract(value, '\$.createdAt') IS NOT NULL
        GROUP BY month
        ORDER BY month;
    " 2>/dev/null | awk -F'|' '{printf "{\"month\":\"%s\",\"conversations\":%s,\"linesGenerated\":%d},", $1, $2, $2*50}' | sed 's/,$//')
fi

# ===== TOP PROJECTS (NEW) =====
PROJECTS_DATA=""
if [ -f "$AI_DB" ]; then
    PROJECTS_DATA=$(sqlite3 "$AI_DB" "
        SELECT 
            CASE 
                WHEN fileName LIKE '%/razorpay/%' THEN 
                    substr(fileName, instr(fileName, '/razorpay/') + 10, 
                           instr(substr(fileName, instr(fileName, '/razorpay/') + 10), '/') - 1)
                WHEN fileName LIKE '%/Users/%' THEN 
                    replace(replace(fileName, rtrim(fileName, replace(fileName, '/', '')), ''), '/', '')
                ELSE 'Other'
            END as project,
            COUNT(*) as count
        FROM ai_code_hashes
        WHERE fileName IS NOT NULL
        GROUP BY project
        ORDER BY count DESC
        LIMIT 6;
    " 2>/dev/null | awk -F'|' '{printf "{\"name\":\"%s\",\"count\":%s},", $1, $2}' | sed 's/,$//')
fi

# ===== PEAK HOUR CALCULATION (NEW) =====
PEAK_HOUR=14
if [ -f "$STATE_DB" ]; then
    PEAK_HOUR=$(sqlite3 "$STATE_DB" "
        SELECT CAST(strftime('%H', datetime(CAST(json_extract(value, '\$.createdAt') AS INTEGER)/1000, 'unixepoch')) AS INTEGER) as hour
        FROM cursorDiskKV 
        WHERE key LIKE 'composerData%' 
        AND json_extract(value, '\$.createdAt') IS NOT NULL
        GROUP BY hour
        ORDER BY COUNT(*) DESC
        LIMIT 1;
    " 2>/dev/null)
fi

# ===== MOST PRODUCTIVE DAY (NEW) =====
BEST_DAY="Wednesday"
if [ -f "$STATE_DB" ]; then
    BEST_DAY=$(sqlite3 "$STATE_DB" "
        SELECT 
            CASE CAST(strftime('%w', datetime(CAST(json_extract(value, '\$.createdAt') AS INTEGER)/1000, 'unixepoch')) AS INTEGER)
                WHEN 0 THEN 'Sunday'
                WHEN 1 THEN 'Monday'
                WHEN 2 THEN 'Tuesday'
                WHEN 3 THEN 'Wednesday'
                WHEN 4 THEN 'Thursday'
                WHEN 5 THEN 'Friday'
                WHEN 6 THEN 'Saturday'
            END as day
        FROM cursorDiskKV 
        WHERE key LIKE 'composerData%' 
        AND json_extract(value, '\$.createdAt') IS NOT NULL
        GROUP BY day
        ORDER BY COUNT(*) DESC
        LIMIT 1;
    " 2>/dev/null)
fi

# ===== THIS WEEK VS LAST WEEK (NEW) =====
THIS_WEEK=0
LAST_WEEK=0
if [ -f "$STATE_DB" ]; then
    THIS_WEEK=$(sqlite3 "$STATE_DB" "
        SELECT COUNT(*) FROM cursorDiskKV 
        WHERE key LIKE 'composerData%' 
        AND json_extract(value, '\$.createdAt') IS NOT NULL
        AND date(CAST(json_extract(value, '\$.createdAt') AS INTEGER)/1000, 'unixepoch') >= date('now', '-7 days');
    " 2>/dev/null)
    
    LAST_WEEK=$(sqlite3 "$STATE_DB" "
        SELECT COUNT(*) FROM cursorDiskKV 
        WHERE key LIKE 'composerData%' 
        AND json_extract(value, '\$.createdAt') IS NOT NULL
        AND date(CAST(json_extract(value, '\$.createdAt') AS INTEGER)/1000, 'unixepoch') >= date('now', '-14 days')
        AND date(CAST(json_extract(value, '\$.createdAt') AS INTEGER)/1000, 'unixepoch') < date('now', '-7 days');
    " 2>/dev/null)
fi

# ===== AVERAGE PER DAY (NEW) =====
TOTAL_DAYS=$(sqlite3 "$STATE_DB" "
    SELECT COUNT(DISTINCT date(CAST(json_extract(value, '\$.createdAt') AS INTEGER)/1000, 'unixepoch'))
    FROM cursorDiskKV 
    WHERE key LIKE 'composerData%' 
    AND json_extract(value, '\$.createdAt') IS NOT NULL;
" 2>/dev/null || echo "1")

AVG_PER_DAY=$((TOTAL_COMPOSERS / (TOTAL_DAYS > 0 ? TOTAL_DAYS : 1)))

# ===== MODE BREAKDOWN (Agent vs Chat) =====
AGENT_SESSIONS=0
CHAT_SESSIONS=0
if [ -f "$STATE_DB" ]; then
    AGENT_SESSIONS=$(sqlite3 "$STATE_DB" "
        SELECT COUNT(*) FROM cursorDiskKV 
        WHERE key LIKE 'composerData%' 
        AND json_extract(value, '\$.unifiedMode') = 'agent';
    " 2>/dev/null || echo "0")
    
    CHAT_SESSIONS=$(sqlite3 "$STATE_DB" "
        SELECT COUNT(*) FROM cursorDiskKV 
        WHERE key LIKE 'composerData%' 
        AND json_extract(value, '\$.unifiedMode') = 'chat';
    " 2>/dev/null || echo "0")
fi

# ===== TOKEN USAGE =====
INPUT_TOKENS=0
OUTPUT_TOKENS=0
if [ -f "$STATE_DB" ]; then
    TOKEN_DATA=$(sqlite3 "$STATE_DB" "
        SELECT 
            COALESCE(SUM(CAST(json_extract(value, '\$.tokenCount.inputTokens') AS INTEGER)), 0),
            COALESCE(SUM(CAST(json_extract(value, '\$.tokenCount.outputTokens') AS INTEGER)), 0)
        FROM cursorDiskKV 
        WHERE key LIKE 'bubbleId%' 
        AND json_extract(value, '\$.tokenCount.inputTokens') IS NOT NULL;
    " 2>/dev/null)
    
    INPUT_TOKENS=$(echo "$TOKEN_DATA" | cut -d'|' -f1)
    OUTPUT_TOKENS=$(echo "$TOKEN_DATA" | cut -d'|' -f2)
fi
TOTAL_TOKENS=$((INPUT_TOKENS + OUTPUT_TOKENS))

# ===== CALCULATE TOTALS =====
TOTAL_CONVERSATIONS=$((TOTAL_COMPOSERS > 0 ? TOTAL_COMPOSERS : 3))
TOTAL_LINES=$((TOTAL_CODE > 0 ? TOTAL_CODE : TOTAL_MESSAGES * 10))
TOTAL_TIME=$((TOTAL_LINES / 30))
FILES_MODIFIED=$(sqlite3 "$AI_DB" "SELECT COUNT(DISTINCT fileName) FROM ai_code_hashes WHERE fileName IS NOT NULL;" 2>/dev/null || echo "0")
UNIQUE_PROJECTS=$(sqlite3 "$AI_DB" "SELECT COUNT(DISTINCT substr(fileName, 1, 50)) FROM ai_code_hashes WHERE fileName IS NOT NULL;" 2>/dev/null || echo "0")

# Determine tracking dates
FIRST_DATE="${COMPOSER_FIRST_DATE:-$CODE_FIRST_DATE}"
LAST_DATE="${COMPOSER_LAST_DATE:-$CODE_LAST_DATE}"

# Get actual join date from telemetry
JOIN_DATE=""
DAYS_SINCE_JOIN=0
if [ -f "$STATE_DB" ]; then
    JOIN_DATE=$(sqlite3 "$STATE_DB" "SELECT value FROM ItemTable WHERE key = 'telemetry.firstSessionDate';" 2>/dev/null)
    if [ -n "$JOIN_DATE" ]; then
        # Convert to timestamp and calculate days
        JOIN_TS=$(date -j -f "%a, %d %b %Y %H:%M:%S GMT" "$JOIN_DATE" "+%s" 2>/dev/null || echo "0")
        NOW_TS=$(date "+%s")
        if [ "$JOIN_TS" -gt 0 ]; then
            DAYS_SINCE_JOIN=$(( (NOW_TS - JOIN_TS) / 86400 ))
        fi
    fi
fi

# Calculate actual longest consecutive streak from daily activity
STREAK_DAYS=1
if [ -f "$STATE_DB" ]; then
    # Get all activity dates sorted
    STREAK_DAYS=$(sqlite3 "$STATE_DB" "
        WITH activity_dates AS (
            SELECT DISTINCT date(CAST(json_extract(value, '\$.createdAt') AS INTEGER)/1000, 'unixepoch') as activity_date
            FROM cursorDiskKV 
            WHERE key LIKE 'composerData%' 
            AND json_extract(value, '\$.createdAt') IS NOT NULL
            ORDER BY activity_date
        ),
        date_with_prev AS (
            SELECT 
                activity_date,
                LAG(activity_date) OVER (ORDER BY activity_date) as prev_date
            FROM activity_dates
        ),
        streaks AS (
            SELECT 
                activity_date,
                CASE 
                    WHEN julianday(activity_date) - julianday(prev_date) = 1 THEN 0
                    ELSE 1 
                END as new_streak
            FROM date_with_prev
        ),
        streak_groups AS (
            SELECT 
                activity_date,
                SUM(new_streak) OVER (ORDER BY activity_date) as streak_group
            FROM streaks
        )
        SELECT MAX(streak_length) FROM (
            SELECT streak_group, COUNT(*) as streak_length
            FROM streak_groups
            GROUP BY streak_group
        );
    " 2>/dev/null || echo "1")
fi

# Ensure streak is at least 1
STREAK_DAYS=${STREAK_DAYS:-1}
if [ "$STREAK_DAYS" -lt 1 ]; then
    STREAK_DAYS=1
fi

# Week over week growth
if [ "$LAST_WEEK" -gt 0 ]; then
    WEEK_GROWTH=$(( (THIS_WEEK - LAST_WEEK) * 100 / LAST_WEEK ))
else
    WEEK_GROWTH=0
fi

# ===== OUTPUT JSON =====
cat << EOF
{
  "summary": {
    "totalConversations": $TOTAL_CONVERSATIONS,
    "totalMessages": $TOTAL_MESSAGES,
    "projectsAssisted": ${UNIQUE_PROJECTS:-8},
    "filesModified": ${FILES_MODIFIED:-0},
    "activeDays": ${TOTAL_DAYS:-1},
    "avgPerDay": ${AVG_PER_DAY:-0}
  },
  "trends": {
    "thisWeek": ${THIS_WEEK:-0},
    "lastWeek": ${LAST_WEEK:-0},
    "weekOverWeekGrowth": ${WEEK_GROWTH:-0},
    "peakHour": ${PEAK_HOUR:-14},
    "bestDay": "${BEST_DAY:-Wednesday}"
  },
  "modeBreakdown": {
    "agent": ${AGENT_SESSIONS:-0},
    "chat": ${CHAT_SESSIONS:-0}
  },
  "tokenUsage": {
    "inputTokens": ${INPUT_TOKENS:-0},
    "outputTokens": ${OUTPUT_TOKENS:-0},
    "totalTokens": ${TOTAL_TOKENS:-0}
  },
  "joinDate": "${JOIN_DATE:-Unknown}",
  "daysSinceJoin": ${DAYS_SINCE_JOIN:-0},
  "trackingSince": "${FIRST_DATE:-Unknown}",
  "lastActivity": "${LAST_DATE:-Unknown}",
  "languageBreakdown": [${LANG_DATA:-}],
  "dailyActivity": [${DAILY_DATA:-}],
  "hourlyDistribution": [${HOURLY_DATA:-}],
  "dayOfWeekBreakdown": [${DOW_DATA:-}],
  "weeklyTrends": [${WEEKLY_DATA:-}],
  "monthlyTrends": [${MONTHLY_DATA:-}],
  "topProjects": [${PROJECTS_DATA:-}],
  "streakDays": $STREAK_DAYS
}
EOF

echo "" >&2
echo "✅ Full history extracted!" >&2
echo "📊 Total code blocks: $TOTAL_CODE" >&2
echo "💬 Total conversations: $TOTAL_COMPOSERS" >&2
echo "📝 Total messages: $TOTAL_MESSAGES" >&2
echo "📅 Tracking since: $FIRST_DATE" >&2
echo "🔥 Peak hour: ${PEAK_HOUR}:00" >&2
echo "📈 Best day: $BEST_DAY" >&2
echo "📊 This week: $THIS_WEEK | Last week: $LAST_WEEK (${WEEK_GROWTH}%)" >&2
