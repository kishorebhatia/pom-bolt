import { json, type LoaderFunctionArgs } from '@remix-run/cloudflare';
import { default as IndexRoute } from './_index';
import { createScopedLogger } from '~/utils/logger';

const logger = createScopedLogger('chat.$id');

export async function loader(args: LoaderFunctionArgs) {
  // Extract initialRequirements from the URL if provided by a webhook
  const url = new URL(args.request.url);
  const initialRequirements = url.searchParams.get('initialRequirements');

  if (initialRequirements) {
    logger.info('Initial requirements detected in URL', {
      projectId: args.params.id,
      requirementsLength: initialRequirements.length,
    });
  }

  return json({
    id: args.params.id,
    initialRequirements: initialRequirements ? decodeURIComponent(initialRequirements) : null,
  });
}

export default IndexRoute;
