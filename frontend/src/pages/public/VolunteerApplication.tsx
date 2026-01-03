import { useState } from 'react';
import { validEmail, validName, validPhoneNumber } from '../../utils/index';
import { apiClient } from '../../api/index'
import styles from './VolunteerApplication.module.css';
import axios from 'axios'

const VolunteerApplication = () => {
    const [firstName, setFirstName] = useState<string>('');
    const [lastName, setLastName] = useState<string>('');
    const [email, setEmail] = useState<string>('');
    const [phoneNumber, setPhoneNumber] = useState<string>('');
    const [motivationText, setMotivationText] = useState<string>('');
    const [submitError, setSubmitError] = useState<string | null>(null)
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false)

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const isValid = validEmail(email) && validName(firstName) && validName(lastName) && validPhoneNumber(phoneNumber) && motivationText.length > 0
        if (!isValid) return
        try{
            const name = firstName + " " + lastName;
            const applicationData = { name, email, "motivation_text": motivationText }
            setIsSubmitting(true)
            await apiClient.post('/api/volunteer-applications/', applicationData)
            setSubmitError(null)
        }
        catch (error: unknown) {
            if (axios.isAxiosError(error)) {
                setSubmitError(error.response?.data?.message ?? "Submission failed. Please try again.")
            }
        }
        finally{
            setIsSubmitting(false)
        
        }
    }
    return (
    <div className={styles.container}>
        <h1>Volunteer Application Page</h1>
        <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.inputContainer}>
        <div className={styles.inputRow}>
        <label htmlFor="first-name">
            First Name
            <input className={styles.inputBox} type="text" id="first-name" value={firstName} onChange={(e)=>setFirstName(e.target.value)} />
        </label>
        </div>
        {!validName(firstName) && <span className={styles.error}>Must contain only letters with length 1-20.</span>}
        </div>
        <label htmlFor="last-name">
            Last Name
            <input className={styles.inputBox} type="text" id="last-name" value={lastName} onChange={(e)=>setLastName(e.target.value)} />
        </label>
        {!validName(lastName) && <span className={styles.error}>Must contain only letters with length 1-20.</span>}

        <label htmlFor="email">
            Email
            <input className={styles.inputBox} type="text" id="email" value={email} onChange={(e)=>setEmail(e.target.value)} />
        </label>
        {!validEmail(email) && <span className={styles.error}>Invalid email</span>}

        <label htmlFor="phone-number">
            Phone Number
            <input className={styles.inputBox} type="text" id="phone-number" value={phoneNumber} onChange={(e)=>setPhoneNumber(e.target.value)} />
        </label>
        {!validPhoneNumber(phoneNumber) && <span className={styles.error}>Please enter a valid phone number e.g. (416-622-6983)</span>}

        <label htmlFor="motivation-text">
            Why do you want to volunteer?
            <input className={styles.inputBox} type="text" id="motivation-text" value={motivationText} onChange={(e)=>setMotivationText(e.target.value)} />
        </label>
        {!motivationText && <span className={styles.error}>This field cannot be empty</span>}
        <p>{submitError}</p>
        <button>{isSubmitting ? "Submitting" : "Submit"}</button>
        </form>
    </div>
    );

}

export default VolunteerApplication;