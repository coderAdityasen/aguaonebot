import { FastifyPluginAsync } from 'fastify';
import { statements } from '../database/db';

export const exportRoutes: FastifyPluginAsync = async (fastify) => {
  // GET /api/export/csv
  // Query params:
  // - type: 'qualified' (default) | 'all'
  // - brand: 'all' (default) | 'aguaone' | 'flovax'
  fastify.get('/api/export/csv', async (req, reply) => {
    const query = (req.query as any) || {};
    const exportType = (query.type || 'qualified').toLowerCase();
    const brandFilter = (query.brand || 'all').toLowerCase();

    let leads = exportType === 'all'
      ? (statements.getAllLeadsForExport.all() as any[])
      : (statements.getQualifiedLeadsForExport.all() as any[]);

    if (brandFilter !== 'all') {
      leads = leads.filter(l => (l.brand || '').toLowerCase() === brandFilter);
    }

    const escapeCsv = (str: any) => {
      const val = str === null || str === undefined ? '' : String(str);
      if (val.includes(',') || val.includes('"') || val.includes('\n') || val.includes('\r')) {
        return `"${val.replace(/"/g, '""')}"`;
      }
      return val;
    };

    let headers: string[] = [];
    let rowBuilder: (lead: any) => string[];

    if (brandFilter === 'flovax') {
      headers = [
        'Phone',
        'Name',
        'Brand',
        'City / District',
        'Shop Status',
        'Experience',
        'Opportunity',
        'Monthly Budget',
        'Firm Name',
        'Import License',
        'Import Experience',
        'PAN Registration',
        'Lead Status',
        'Bot Active',
        'Created At',
        'Last Updated'
      ];
      rowBuilder = (lead: any) => [
        escapeCsv(lead.phone),
        escapeCsv(lead.name),
        escapeCsv(lead.brand ? lead.brand.toUpperCase() : 'FLOVAX'),
        escapeCsv(lead.city),
        escapeCsv(lead.shop_status),
        escapeCsv(lead.experience),
        escapeCsv(lead.opportunity),
        escapeCsv(lead.budget),
        escapeCsv(lead.firm_name),
        escapeCsv(lead.import_license),
        escapeCsv(lead.import_experience),
        escapeCsv(lead.pan_registration),
        escapeCsv(lead.lead_status),
        escapeCsv(lead.bot_active === 0 ? 'No (Human Handoff)' : 'Yes (Bot Active)'),
        escapeCsv(lead.created_at),
        escapeCsv(lead.updated_at)
      ];
    } else if (brandFilter === 'aguaone') {
      headers = [
        'Phone',
        'Name',
        'Brand',
        'City',
        'Category',
        'Shop Status',
        'Experience',
        'Opportunity',
        'Monthly Budget',
        'GST Status',
        'Lead Status',
        'Bot Active',
        'Created At',
        'Last Updated'
      ];
      rowBuilder = (lead: any) => [
        escapeCsv(lead.phone),
        escapeCsv(lead.name),
        escapeCsv(lead.brand ? lead.brand.toUpperCase() : 'AGUAONE'),
        escapeCsv(lead.city),
        escapeCsv(lead.category),
        escapeCsv(lead.shop_status),
        escapeCsv(lead.experience),
        escapeCsv(lead.opportunity),
        escapeCsv(lead.budget),
        escapeCsv(lead.gst_status),
        escapeCsv(lead.lead_status),
        escapeCsv(lead.bot_active === 0 ? 'No (Human Handoff)' : 'Yes (Bot Active)'),
        escapeCsv(lead.created_at),
        escapeCsv(lead.updated_at)
      ];
    } else {
      // Unified sheet for All brands
      headers = [
        'Phone',
        'Name',
        'Brand',
        'City',
        'Category',
        'Shop Status',
        'Experience',
        'Opportunity',
        'Monthly Budget',
        'Firm Name',
        'Import License',
        'Import Experience',
        'PAN Registration',
        'GST Status',
        'Lead Status',
        'Bot Active',
        'Created At',
        'Last Updated'
      ];
      rowBuilder = (lead: any) => [
        escapeCsv(lead.phone),
        escapeCsv(lead.name),
        escapeCsv(lead.brand ? lead.brand.toUpperCase() : ''),
        escapeCsv(lead.city),
        escapeCsv(lead.category),
        escapeCsv(lead.shop_status),
        escapeCsv(lead.experience),
        escapeCsv(lead.opportunity),
        escapeCsv(lead.budget),
        escapeCsv(lead.firm_name),
        escapeCsv(lead.import_license),
        escapeCsv(lead.import_experience),
        escapeCsv(lead.pan_registration),
        escapeCsv(lead.gst_status),
        escapeCsv(lead.lead_status),
        escapeCsv(lead.bot_active === 0 ? 'No (Human Handoff)' : 'Yes (Bot Active)'),
        escapeCsv(lead.created_at),
        escapeCsv(lead.updated_at)
      ];
    }

    const csvRows = [headers.join(',')];

    for (const lead of leads) {
      csvRows.push(rowBuilder(lead).join(','));
    }

    // Include UTF-8 Byte Order Mark (BOM) so Excel renders international/Nepali text accurately
    const csvContent = '\uFEFF' + csvRows.join('\r\n');

    const brandPrefix = brandFilter !== 'all' ? `${brandFilter}_` : '';
    const filename = `${brandPrefix}${exportType}_leads_${Date.now()}.csv`;

    reply.header('Content-Type', 'text/csv; charset=utf-8');
    reply.header('Content-Disposition', `attachment; filename="${filename}"`);
    reply.header('Access-Control-Expose-Headers', 'Content-Disposition');
    return reply.send(csvContent);
  });
};
