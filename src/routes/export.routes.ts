import { FastifyPluginAsync } from 'fastify';
import { statements } from '../database/db';

export const exportRoutes: FastifyPluginAsync = async (fastify) => {
  // GET /api/export/csv
  fastify.get('/api/export/csv', async (req, reply) => {
    const leads = statements.getQualifiedLeadsForExport.all() as any[];

    const headers = [
      'Phone',
      'Name',
      'Brand',
      'City',
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
      'Created At',
      'Last Updated'
    ];

    const escapeCsv = (str: any) => {
      const val = str === null || str === undefined ? '' : String(str);
      if (val.includes(',') || val.includes('"') || val.includes('\n')) {
        return `"${val.replace(/"/g, '""')}"`;
      }
      return val;
    };

    const csvRows = [headers.join(',')];

    for (const lead of leads) {
      csvRows.push(
        [
          escapeCsv(lead.phone),
          escapeCsv(lead.name),
          escapeCsv(lead.brand ? lead.brand.toUpperCase() : ''),
          escapeCsv(lead.city),
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
          escapeCsv(lead.created_at),
          escapeCsv(lead.updated_at)
        ].join(',')
      );
    }

    const csvContent = csvRows.join('\r\n');

    reply.header('Content-Type', 'text/csv; charset=utf-8');
    reply.header('Content-Disposition', `attachment; filename="aguaone_qualified_leads_${Date.now()}.csv"`);
    return reply.send(csvContent);
  });
};
