interface PastEventProps {
  id: string;
  name: string;
  type: string;
  winningTeam: string;
  gameDetails?: {
    periodLength: number;
    format: string;
    intervals: number;
    mediaCount: number;
  };
  status: string;
  onDelete: (id: string) => void;
}

export default function PastEventCard({
  id,
  name,
  type,
  winningTeam,
  gameDetails = {
    periodLength: 0,
    format: '-',
    intervals: 0,
    mediaCount: 0
  },
  status,
  onDelete
}: PastEventProps) {
  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this event? This action cannot be undone.')) return;
    
    try {
      const response = await fetch(`/api/events/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete event');
      
      onDelete(id);
    } catch (error) {
      console.error('Error deleting event:', error);
      alert('Failed to delete event. Please try again.');
    }
  };

  return (
    <div className="bg-[#1F1F21] backdrop-blur-md border border-[#2C2C2E] rounded-xl p-6">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="text-lg font-semibold text-text-primary">{name}</h3>
          <p className="text-sm text-text-secondary">{status}</p>
        </div>
        <button
          onClick={handleDelete}
          className="p-2 text-text-tertiary hover:text-status-error transition-colors rounded-lg hover:bg-dark-surface"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 6h18"></path>
            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
          </svg>
        </button>
      </div>

      <div className="grid grid-cols-2 gap-x-8 gap-y-4 mb-6">
        <div>
          <div className="text-sm text-text-secondary mb-1">Event Type</div>
          <div className="text-xl text-text-primary">{type}</div>
        </div>

        <div>
          <div className="text-sm text-text-secondary mb-1">Winning Team</div>
          <div className="text-xl text-text-primary">{winningTeam || 'N/A'}</div>
        </div>

        <div>
          <div className="text-sm text-text-secondary mb-1">Period Length</div>
          <div className="text-xl text-text-primary">{gameDetails?.periodLength || 0} min</div>
        </div>

        <div>
          <div className="text-sm text-text-secondary mb-1">Format</div>
          <div className="text-xl text-text-primary">{gameDetails?.format || '-'}</div>
        </div>

        <div>
          <div className="text-sm text-text-secondary mb-1">Intervals</div>
          <div className="text-xl text-text-primary">{gameDetails?.intervals || 0} seconds</div>
        </div>

        <div>
          <div className="text-sm text-text-secondary mb-1">Media</div>
          <div className="text-xl text-text-primary">{gameDetails?.mediaCount || 0}</div>
        </div>
      </div>

      <button
        className="w-full py-3 bg-dark-surface hover:bg-dark-surface-lighter text-text-primary font-medium rounded-lg transition-colors"
      >
        View Past Event
      </button>
    </div>
  );
} 