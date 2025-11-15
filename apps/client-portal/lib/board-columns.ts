/**
 * Board Column Management
 * Handles dynamic column fetching and caching for company ticket boards
 */

export interface BoardColumn {
  id: string;
  title: string;
  type: string;
  settings_str?: string;
}

interface ColumnCache {
  [boardId: string]: {
    columns: BoardColumn[];
    timestamp: number;
  };
}

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const columnCache: ColumnCache = {};

async function callMondayAPI(query: string, variables?: Record<string, any>) {
  const response = await fetch('https://api.monday.com/v2', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': process.env.NEXT_PUBLIC_MONDAY_API_TOKEN || '',
      'API-Version': '2023-10'
    },
    body: JSON.stringify({ query, variables })
  });

  const result = await response.json();
  
  if (result.errors) {
    console.error('Monday API errors:', result.errors);
    throw new Error(result.errors[0]?.message || 'Monday API error');
  }
  
  return result;
}

/**
 * Fetch columns for a specific board
 */
export async function fetchBoardColumns(boardId: string): Promise<BoardColumn[]> {
  // Check cache first
  const cached = columnCache[boardId];
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    console.log(`📦 Using cached columns for board ${boardId}`);
    return cached.columns;
  }

  console.log(`🔍 Fetching columns for board ${boardId}`);

  try {
    const query = `
      query GetBoardColumns($boardId: [ID!]!) {
        boards(ids: $boardId) {
          columns {
            id
            title
            type
            settings_str
          }
        }
      }
    `;

    const response = await callMondayAPI(query, {
      boardId: [boardId]
    });

    if (response.data?.boards?.[0]?.columns) {
      const columns = response.data.boards[0].columns;
      
      // Cache the columns
      columnCache[boardId] = {
        columns,
        timestamp: Date.now()
      };

      console.log(`✅ Fetched ${columns.length} columns for board ${boardId}`);
      return columns;
    }

    return [];
  } catch (err) {
    console.error('Failed to fetch board columns:', err);
    return [];
  }
}

/**
 * Get column ID by title (case-insensitive)
 */
export function getColumnIdByTitle(columns: BoardColumn[], title: string): string | null {
  const column = columns.find(col => 
    col.title.toLowerCase() === title.toLowerCase()
  );
  return column?.id || null;
}

/**
 * Get column by ID
 */
export function getColumnById(columns: BoardColumn[], columnId: string): BoardColumn | null {
  return columns.find(col => col.id === columnId) || null;
}

/**
 * Clear cache for a specific board or all boards
 */
export function clearColumnCache(boardId?: string) {
  if (boardId) {
    delete columnCache[boardId];
    console.log(`🗑️ Cleared cache for board ${boardId}`);
  } else {
    Object.keys(columnCache).forEach(key => delete columnCache[key]);
    console.log('🗑️ Cleared all column cache');
  }
}

/**
 * Format column value based on type
 */
export function formatColumnValue(column: BoardColumn, rawValue: any): string {
  if (!rawValue) return '';

  try {
    switch (column.type) {
      case 'email':
        if (typeof rawValue === 'string') {
          try {
            const parsed = JSON.parse(rawValue);
            return parsed.email || parsed.text || '';
          } catch {
            return rawValue;
          }
        }
        return rawValue.email || rawValue.text || '';

      case 'status':
      case 'dropdown':
        if (typeof rawValue === 'string') {
          try {
            const parsed = JSON.parse(rawValue);
            return parsed.label || '';
          } catch {
            return rawValue;
          }
        }
        return rawValue.label || '';

      case 'date':
        if (typeof rawValue === 'string') {
          try {
            const parsed = JSON.parse(rawValue);
            return parsed.date || '';
          } catch {
            return rawValue;
          }
        }
        return rawValue.date || '';

      case 'long_text':
      case 'text':
        return String(rawValue);

      default:
        return String(rawValue);
    }
  } catch (err) {
    console.error(`Failed to format column ${column.id}:`, err);
    return String(rawValue);
  }
}

/**
 * Get user-friendly display columns (exclude system columns)
 */
export function getDisplayColumns(columns: BoardColumn[]): BoardColumn[] {
  const systemColumns = ['name', 'subitems', 'dependency', 'timeline', 'mirror'];
  
  return columns.filter(col => 
    !systemColumns.includes(col.id) && 
    !systemColumns.includes(col.type)
  );
}
