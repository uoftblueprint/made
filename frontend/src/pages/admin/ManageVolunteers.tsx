// import { useVolunteerApplications, useUpdateVolunteerStatus } from '../../actions/useVolunteers';
import { useState } from 'react'
import Button from '../../components/common/Button.tsx';
import StatisticBox from '../../components/common/StatisticBox.tsx';
import Card from '../../components/common/Card.tsx';
import FeatureCard from '../../components/common/FeatureCard.tsx'
import {BulletRow} from '../../components/common/BulletRow.tsx'
import Modal from '../../components/common/Modal.tsx';
import VolunteerApplication from '../public/VolunteerApplication.tsx';
import VolunteerList from '../../components/volunteers/VolunteerList.tsx'
import type {VolunteerRow} from '../../components/volunteers/VolunteerList.tsx'

const ManageVolunteers: React.FC = () => {
      const [rows, setRows] = useState<VolunteerRow[]>([
      {
        id: "1",
        name: "Sarah Chen",
        email: "sarah.chen@example.com",
        role: "Editor",
        grantedDate: "2026-02-02",
        expiresDate: "2026-03-03",
        daysRemaining: 10,
        status: "Active",
      },
      {
        id: "2",
        name: "Alex Kim",
        email: "alex.kim@example.com",
        role: "Viewer",
        grantedDate: "2025-12-01",
        expiresDate: "2026-01-01",
        daysRemaining: -52,
        status: "Expired",
      },
    ])

    const onEdit = (r: (typeof rows)[number]) => {
      console.log("edit", r)
    }

    const onExtend = (r: (typeof rows)[number]) => {
      console.log("extend", r)
    }

    const onRenew = (r: (typeof rows)[number]) => {
      console.log("renew", r)
    }

    const onDelete = (r: (typeof rows)[number]) => {
      setRows((prev) => prev.filter((x) => x.id !== r.id))
    }
    const [formOpen, setFormOpen] = useState<boolean>(false)
    // const { data = [], isLoading, isError } = useVolunteerApplications(); // to replace with data once the endpoint data is complete
    // const mutation = useUpdateVolunteerStatus();
    // const onApprove = (id: number) => {
    //     mutation.mutate({id, action: "APPROVED"})
    // }
    // const onReject = (id: number) => {
    //     mutation.mutate({id, action: "REJECTED"})
    // }

    // if (isLoading) return <div>Loading...</div>;
    // if (isError) return <div>Error loading volunteer applications.</div>;
    return <>
    <Modal open={formOpen} onClose={() => setFormOpen(false)} title="Add volunteer">
        <VolunteerApplication onClose={() => setFormOpen(false)}/>
    </Modal>
    <div className='flex justify-between pb-5'>
        <div>
            <h1 className='title pb-2'>Volunteer Management Page</h1> 
            <p className='subtitle pb-5'>Manage volunteer access, roles, and expiration</p>
        </div>
        <Button variant='primary' icon='plus' size='lg' onClick={() => setFormOpen(true)}>Volunteer</Button>
    </div>
    <div className='flex justify-evenly gap-1'>
        <StatisticBox title='Active Volunteers' value={3} iconName='person'/>
        <StatisticBox title='Expiring Soon (≤7 days)' value={1} iconName='yellow_clock'/>
        <StatisticBox title='Expired Accounts' value={1} iconName='reject'/>
        <StatisticBox title='Total Volunteers' value={4} iconName='shield'/>
    </div>
    <Card className='mt-7'>
      <h1 className='title text-2xl mb-5'>Role Permissions</h1>
      <div className='flex gap-3'>
        <FeatureCard
          title="Viewer"
          variant="compact"
          className='grow'
          icon='shield'
          border='off'
          shadow='none'
          bg='surface'
        >
          <BulletRow text="Read-only catalogue access" />
          <BulletRow text="View item details" />
          <BulletRow text="Search and filter" />
          <BulletRow text="No editing permissions" />
        </FeatureCard>
        <FeatureCard
          title="Editor"
          variant="compact"
          className='grow'
          icon='shield'
          border='off'
          shadow='none'
          bg='surface'
        >
          <BulletRow text="All Viewer permissions" />
          <BulletRow text="Add new items" />
          <BulletRow text="Edit existing items" />
          <BulletRow text="All changes need review" />
        </FeatureCard>
        <FeatureCard
          title="Admin"
          variant="compact"
          className='grow'
          icon='shield'
          border='off'
          shadow='none'
          bg='surface'
        >
          <BulletRow text="All Editor permissions" />
          <BulletRow text="Review and approve entries" />
          <BulletRow text="Manage volunteers" />
          <BulletRow text="Export data" />
        </FeatureCard>
      </div>
    </Card>
    <div className="w-full py-6">
      <VolunteerList
        title="All Volunteers"
        rows={rows}
        onEdit={onEdit}
        onExtend={onExtend}
        onRenew={onRenew}
        onDelete={onDelete}
      />
    </div>
    <FeatureCard
      title="Automatic Expiration Handling"
      icon="black_clock"
      border='on'
      shadow='none'
      bg='card' className='mb-5'
    >
      <BulletRow heading="Background Job Queue" text="System checks expiring accounts daily" />
      <BulletRow heading="7-Day Warning" text="Admins notified when accounts have ≤7 days remaining" />
      <BulletRow heading='Auto-Deactivation' text=" Accounts automatically deactivated on expiration date" />
      <BulletRow heading='Email Reminders' text="Optional email notifications to volunteers before expiration" />
    </FeatureCard>
    </>

}

export default ManageVolunteers;