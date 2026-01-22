import { useVolunteerApplications, useUpdateVolunteerStatus } from '../../actions/useVolunteers';
import { VolunteerList } from '../../components/items/index.ts';
import { useState } from 'react'

const ManageVolunteers = () => {
    const sortedByOptions = ['Status', 'Date Applied', 'Name'];
    const [sortBy, setSortBy] = useState<string>(sortedByOptions[0]);
    const [searchCharacters, setSearchCharacters] = useState<string>('');
    const { data = [], isLoading, isError } = useVolunteerApplications();
    const mutation = useUpdateVolunteerStatus();
    const onApprove = (id: number) => {
        mutation.mutate({id, action: "APPROVED"})
    }
    const onReject = (id: number) => {
        mutation.mutate({id, action: "REJECTED"})
    }

    const onSort = () => {
        const currentIndex = sortedByOptions.indexOf(sortBy);
        const nextIndex = (currentIndex + 1) % sortedByOptions.length;
        setSortBy(sortedByOptions[nextIndex]);

    }

    if (isLoading) return <div>Loading...</div>;
    if (isError) return <div>Error loading volunteer applications.</div>;
    return <>
    <h1>Volunteer Management Page</h1> 
    <h2>Sorted by: </h2>
    <button onClick={()=>onSort()}>{sortBy}</button>
    <input type='search' value={searchCharacters} onChange={(e)=>setSearchCharacters(e.target.value)}></input>
    <VolunteerList volunteers={data} onApprove={onApprove} onReject={onReject} sortedBy={sortBy} searchBy={searchCharacters}/>
    </>

}

export default ManageVolunteers;