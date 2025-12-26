import { motion } from 'framer-motion';
import { Search, Users, FileText, CreditCard } from 'lucide-react';

interface EmptyStateProps {
  type: 'search' | 'students' | 'receipts' | 'transactions';
  searchTerm?: string;
}

const emptyStateConfig = {
  search: {
    icon: Search,
    title: 'No results found',
    description: 'Try adjusting your search terms or filters',
  },
  students: {
    icon: Users,
    title: 'No students yet',
    description: 'Add your first student to get started',
  },
  receipts: {
    icon: FileText,
    title: 'No receipts found',
    description: 'Your payment receipts will appear here',
  },
  transactions: {
    icon: CreditCard,
    title: 'No transactions yet',
    description: 'Payment transactions will appear here',
  },
};

export function EmptyState({ type, searchTerm }: EmptyStateProps) {
  const config = emptyStateConfig[type];
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-16 px-4"
    >
      <div className="relative mb-6">
        {/* Background circles */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-32 h-32 rounded-full bg-primary/5 animate-pulse" />
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-24 h-24 rounded-full bg-primary/10" />
        </div>
        
        {/* Icon */}
        <div className="relative w-20 h-20 rounded-full bg-muted flex items-center justify-center">
          <Icon className="w-10 h-10 text-muted-foreground/50" />
        </div>
      </div>
      
      <h3 className="text-lg font-semibold text-foreground mb-2">
        {config.title}
      </h3>
      
      <p className="text-muted-foreground text-center max-w-sm">
        {searchTerm ? (
          <>
            No results for "<span className="font-medium">{searchTerm}</span>". {config.description.toLowerCase()}.
          </>
        ) : (
          config.description
        )}
      </p>
    </motion.div>
  );
}
