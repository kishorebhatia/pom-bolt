import { json } from '@remix-run/node';
import type { ActionFunctionArgs, LoaderFunctionArgs } from '@remix-run/node';

// Simple in-memory storage for requirements (in production, use a database)
interface RequirementData {
  content: string;
  timestamp: number;
  processed: boolean;
}

// Define interface for the request body
interface RequirementsRequestBody {
  content?: string;
  markAsProcessed?: boolean;
}

let requirements: RequirementData | null = null;

export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== 'POST') {
    return json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    // Parse request body
    let body: RequirementsRequestBody;
    const contentType = request.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
      body = (await request.json()) as RequirementsRequestBody;
    } else {
      // Handle form data or other formats
      const formData = await request.formData();
      body = {
        content: formData.get('content')?.toString(),
        markAsProcessed: formData.get('markAsProcessed') === 'true',
      };
    }

    console.log('Received webhook request:', { body, contentType });

    // Handle marking requirements as processed
    if (body.markAsProcessed) {
      if (requirements) {
        requirements.processed = true;
        return json({ success: true, message: 'Requirements marked as processed' });
      }

      return json({ error: 'No requirements to mark as processed' }, { status: 404 });
    }

    // Handle new requirements submission
    if (!body.content || typeof body.content !== 'string') {
      console.error('Invalid content in request:', body);
      return json(
        {
          error: 'Requirements content is required and must be a string',
          received: body,
        },
        { status: 400 },
      );
    }

    // Store the requirements with a processed flag set to false
    requirements = {
      content: body.content,
      timestamp: Date.now(),
      processed: false,
    };

    console.log('Stored new requirements:', requirements);

    return json({ success: true, message: 'Requirements received' });
  } catch (error) {
    console.error('Error processing requirements webhook:', error);
    return json(
      {
        error: 'Failed to process requirements',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}

// Define interface for response data
export interface RequirementsResponseData {
  hasRequirements: boolean;
  processed: boolean;
  timestamp: number | null;
  content: string | null;
}

export async function loader({ request }: LoaderFunctionArgs) {
  // Only allow GET requests
  if (request.method !== 'GET') {
    return json({ error: 'Method not allowed' }, { status: 405 });
  }

  // Return the current requirements state
  return json({
    hasRequirements: requirements !== null,
    processed: requirements?.processed || false,
    timestamp: requirements?.timestamp || null,
    content: requirements?.content || null,
  } as RequirementsResponseData);
}

// Helper function to mark requirements as processed
export function markRequirementsAsProcessed() {
  if (requirements) {
    requirements.processed = true;
  }
}

// Helper function to get and consume the requirements
export function getAndConsumeRequirements(): string | null {
  if (requirements && !requirements.processed) {
    const content = requirements.content;
    requirements.processed = true;

    return content;
  }

  return null;
}
