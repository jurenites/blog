export function parse_figma_reference(figma_url) {
  let reference_url;
  try { reference_url = new URL(figma_url); } catch { throw new Error('Enter a Figma link to a specific component.'); }
  const path_parts = reference_url.pathname.split('/').filter(Boolean);
  const node_identifier = reference_url.searchParams.get('node-id')?.replace('-', ':');
  const file_identifier = path_parts[2] === 'branch' ? path_parts[3] : path_parts[1];
  if (!['figma.com', 'www.figma.com'].includes(reference_url.hostname) || !['design', 'file'].includes(path_parts[0]) || !/^[a-zA-Z0-9]+$/.test(file_identifier ?? '') || !/^\d+:\d+$/.test(node_identifier ?? '')) throw new Error('Enter a Figma component link containing node-id.');
  return { file_identifier, node_identifier };
}

export async function obtain_figma_png(figma_url, { access_token = process.env.FIGMA_ACCESS_TOKEN, fetch_request = fetch } = {}) {
  const { file_identifier, node_identifier } = parse_figma_reference(figma_url);
  if (!access_token) throw new Error('Figma export is not connected. Configure FIGMA_ACCESS_TOKEN on the local dashboard server, or obtain the PNG through Codex and upload it here.');
  const export_url = new URL(`https://api.figma.com/v1/images/${file_identifier}`);
  export_url.search = new URLSearchParams({ ids: node_identifier, scale: '1', format: 'png', contents_only: 'true' }).toString();
  const export_response = await fetch_request(export_url, { headers: { 'X-Figma-Token': access_token }, signal: AbortSignal.timeout(60000) });
  if (!export_response.ok) throw new Error(`Figma export failed (${export_response.status}). Check access to the linked file.`);
  const export_data = await export_response.json();
  const image_url = export_data.images?.[node_identifier];
  if (!image_url) throw new Error('Figma could not render the linked component.');
  const download_url = new URL(image_url);
  if (download_url.protocol !== 'https:') throw new Error('Figma returned an invalid image URL.');
  const image_response = await fetch_request(download_url, { signal: AbortSignal.timeout(60000) });
  if (!image_response.ok) throw new Error('Could not download the exported Figma PNG.');
  const image_buffer = Buffer.from(await image_response.arrayBuffer());
  if (image_buffer.length > 8 * 1024 * 1024) throw new Error('The exported PNG exceeds 8 MB. Select a smaller Figma node.');
  return `data:image/png;base64,${image_buffer.toString('base64')}`;
}
