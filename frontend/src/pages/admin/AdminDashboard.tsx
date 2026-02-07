import FeatureCard from '../../components/common/FeatureCard';
import {ActivityRow} from '../../components/common/ActivityRow'
import StatisticBox from '../../components/common/StatisticBox';
import Button from '../../components/common/Button';
import { useAuth } from '../../contexts';
import './AdminDashboard.css';

const AdminDashboard: React.FC = () => {
  const handleExportToCSV = () => {
  }

  const handleAddNewItem = () => {

  }

  const handleCreateContainer = () => {

  }

  const { user } = useAuth();

  return (
    <div>
      
      <h1 className='title pb-2'>Dashboard</h1>
      <p className='subtitle pb-5'>Overview of collection status and pending tasks</p>
      <div className='flex justify-evenly gap-8 pb-8'>
        <StatisticBox title='Needs Review' value={28} iconName='orange_information'/>
        <StatisticBox title='Total Items' value={"50,247"} iconName='toaster'/>
        <StatisticBox title='Containers' value={156} iconName='cube'/>
        <StatisticBox title='Locations' value={12} iconName='location'/>
    </div>
    <div className='flex gap-2 pb-5'>
      <Button variant='outline-black' radius='md' icon='toaster' size='xxl' layout="stacked" fullWidth={true} onClick={handleAddNewItem}>Add New Item</Button>
      <Button variant='outline-black' radius='md' icon='cube' size='xxl' layout="stacked" fullWidth={true} onClick={handleCreateContainer}>Create Container</Button>
      <Button variant='outline-black' radius='md' icon='download' size='xxl' layout="stacked" fullWidth={true} onClick={handleExportToCSV}>Export to CSV</Button>
    </div>
      <FeatureCard
        title="Recent Activity"
        variant="activity"
        showHeaderDivider={true}
      >
        <ActivityRow text="Super Mario 64 moved to Exhibit-Floor2" time="1h ago" />
        <ActivityRow text="3 items added to Box C-15" time="3h ago" />
        <ActivityRow text="Hat Trick submitted via public form" time="5h ago" />
        <ActivityRow text="Volunteer Sarah Chen granted access" time="1d ago" />
      </FeatureCard>
    </div>
  );
};

export default AdminDashboard;