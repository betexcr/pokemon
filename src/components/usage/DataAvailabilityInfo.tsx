import React from 'react';
import { Info, Calendar, Database, AlertCircle } from 'lucide-react';

interface DataAvailabilityInfoProps {
  platform: string;
  generation: string;
  format: string;
}

export default function DataAvailabilityInfo({ platform, generation, format }: DataAvailabilityInfoProps) {
  const getAvailableDataInfo = () => {
    if (platform === 'SMOGON_SINGLES') {
      return {
        title: 'Smogon Singles Data',
        description: 'Smogon provides usage statistics for competitive singles formats',
        availableMonths: [
          '2024-11', '2024-10', '2024-09', '2024-08', '2024-07', 
          '2024-06', '2024-05', '2024-04', '2024-03', '2024-02', '2024-01',
          '2023-12', '2023-11', '2023-10', '2023-09'
        ],
        availableFormats: ['OU', 'UU', 'RU', 'NU', 'UBERS', 'PU', 'MONOTYPE'],
        note: 'Data is typically available 1-2 months after the end of each month'
      };
    } else if (platform === 'VGC_OFFICIAL') {
      return {
        title: 'VGC Official Data',
        description: 'Official VGC usage statistics from tournament data',
        availableMonths: ['2024-11', '2024-10', '2024-09'],
        availableFormats: ['VGC_REG_C', 'VGC_REG_D', 'VGC_REG_E'],
        note: 'VGC data availability varies by tournament schedule'
      };
    } else if (platform === 'BSS_OFFICIAL') {
      return {
        title: 'Battle Stadium Singles Data',
        description: 'Official Battle Stadium Singles usage statistics',
        availableMonths: ['2024-11', '2024-10'],
        availableFormats: ['BSS_SERIES_13', 'BSS_SERIES_14'],
        note: 'BSS data is updated monthly based on ladder activity'
      };
    }
    
    return {
      title: 'Unknown Platform',
      description: 'No data source information available',
      availableMonths: [],
      availableFormats: [],
      note: 'Please select a valid platform'
    };
  };

  const dataInfo = getAvailableDataInfo();

  return (
    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
      <div className="flex items-start gap-3">
        <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">
            {dataInfo.title}
          </h3>
          <p className="text-blue-700 dark:text-blue-300 mb-4">
            {dataInfo.description}
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                  Available Months
                </span>
              </div>
              <div className="flex flex-wrap gap-1">
                {dataInfo.availableMonths.slice(0, 8).map(month => (
                  <span 
                    key={month}
                    className="px-2 py-1 bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 text-xs rounded"
                  >
                    {month}
                  </span>
                ))}
                {dataInfo.availableMonths.length > 8 && (
                  <span className="px-2 py-1 bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 text-xs rounded">
                    +{dataInfo.availableMonths.length - 8} more
                  </span>
                )}
              </div>
            </div>
            
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Database className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                  Available Formats
                </span>
              </div>
              <div className="flex flex-wrap gap-1">
                {dataInfo.availableFormats.map(format => (
                  <span 
                    key={format}
                    className="px-2 py-1 bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 text-xs rounded"
                  >
                    {format}
                  </span>
                ))}
              </div>
            </div>
          </div>
          
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-blue-700 dark:text-blue-300">
              {dataInfo.note}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
