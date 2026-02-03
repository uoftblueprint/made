import { useState, useEffect } from 'react';
import { validEmail, validName, validPhoneNumber } from '../../utils/index';
import styles from './VolunteerApplication.module.css';
import { useCreateVolunteer } from '../../actions/useVolunteers';
import type { AxiosError } from 'axios';

const VolunteerApplication = () => {
    const [firstName, setFirstName] = useState<string>('');
    const [lastName, setLastName] = useState<string>('');
    const [email, setEmail] = useState<string>('');
    const [phoneNumber, setPhoneNumber] = useState<string>('');
    const [motivationText, setMotivationText] = useState<string>('');
    const [submitError, setSubmitError] = useState<string>('')
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false)

    const createVolunteerMutation = useCreateVolunteer()
    
    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const isValid = validEmail(email) && validName(firstName) && validName(lastName) && validPhoneNumber(phoneNumber) && motivationText.length > 0
        if (!isValid) {
            setSubmitError("Please fix the errors in the form above before submission.");
            return;
        }
        const name = firstName + " " + lastName;
        const applicationData = { name, email, "motivation_text": motivationText }
        setIsSubmitting(true)
        createVolunteerMutation.mutate(applicationData, {
            onSuccess: () => {
                setSubmitError('');
                setIsSubmitting(false);
                // Clear the form after successful submission
                setFirstName('');
                setLastName('');
                setEmail('');
                setPhoneNumber('');
                setMotivationText('');
                alert("Application submitted successfully!"); // TODO: change later to redirect
            },
            onError: (error: AxiosError) =>{
                setIsSubmitting(false)
                if (error.response) {
                setSubmitError(String(error.response.status))
                return
                }
                if (error.request) {
                    setSubmitError("Server unreachable, please check your connection.")
                    return
                }
                setSubmitError("Unexpected error")
            }
        })

    }

    useEffect(()=>{
        setSubmitError('')
    },[firstName, lastName, email, phoneNumber, motivationText])
    return (
    <div className={styles.container}>
        <h1>Volunteer Application Page</h1>
        <form className={styles.form} onSubmit={handleSubmit}>

            <div className={styles.inputContainer}>
                <div className={styles.inputRow}>
                    <label htmlFor="first-name">First Name</label>
                    <input type="text" id="first-name" className={styles.inputBox} value={firstName} onChange={(e)=>setFirstName(e.target.value)} />
                </div>
                {!validName(firstName) && <span className={styles.error}>Must contain only letters with length 1-20.</span>}
            </div>

            <div className={styles.inputContainer}>
                <div className={styles.inputRow}>
                    <label htmlFor="last-name">Last Name</label>
                    <input type="text" id="last-name" className={styles.inputBox} value={lastName} onChange={(e)=>setLastName(e.target.value)} />
                </div>
                {!validName(lastName) && <span className={styles.error}>Must contain only letters with length 1-20.</span>}
            </div>

            <div className={styles.inputContainer}>
                <div className={styles.inputRow}>
                    <label htmlFor="email">Email</label>
                    <input type="email" id="email" className={styles.inputBox} value={email} onChange={(e)=>setEmail(e.target.value)} />
                </div>
                {!validEmail(email) && <span className={styles.error}>Invalid email</span>}
            </div>

            <div className={styles.inputContainer}>
                <div className={styles.inputRow}>
                    <label htmlFor="phone-number">Phone Number</label>
                    <input type="tel" id="phone-number" className={styles.inputBox} value={phoneNumber} onChange={(e)=>setPhoneNumber(e.target.value)} />
                </div>
                {!validPhoneNumber(phoneNumber) && <span className={styles.error}>Please enter a valid phone number e.g. (416-622-6983)</span>}
            </div>

            <div className={styles.inputContainer}>
                <div className={styles.inputRow}>
                    <label htmlFor="motivation-text">Why do you want to volunteer?</label>
                    <textarea id="motivation-text" className={styles.inputBox} value={motivationText} onChange={(e)=>setMotivationText(e.target.value)} />
                </div>
                {!motivationText && <span className={styles.error}>This field cannot be empty</span>}
            </div>
            {submitError && <p>{submitError}</p>}
            <button disabled={isSubmitting}>{isSubmitting ? "Submitting" : "Submit"}</button>
        </form>
    </div>
    );

}

export default VolunteerApplication;