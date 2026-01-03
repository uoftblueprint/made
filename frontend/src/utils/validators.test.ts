import { describe, it, expect } from 'vitest'
import { validName, validPhoneNumber, validEmail } from './validators'

describe('validName', () => {
    it('return true for valid names', () => {
        expect(validName('Bob')).toBe(true)
        expect(validName('Alice')).toBe(true)
    }
    )
    it('return false for invalid names', () => {
        expect(validName('')).toBe(false) 
        expect(validName('aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa')).toBe(false) 
        expect(validName('Bob123')).toBe(false) 
        expect(validName('_Bob')).toBe(false) 
    }   )
})

describe('validPhoneNumber', () => {
    it('return true for properly formatted phone numbers', () => {
        expect(validPhoneNumber('1234567890')).toBe(true)
        expect(validPhoneNumber('123-456-7890')).toBe(true)
        expect(validPhoneNumber('(123) 456 7890')).toBe(true)
    })
    it('return false for invalid phone numbers', () => {
        expect(validPhoneNumber('123456789')).toBe(false) 
        expect(validPhoneNumber('12345678901')).toBe(false) 
        expect(validPhoneNumber('123-45a-7890')).toBe(false) 
    })  
}   )

describe('validEmail', () => {
    it('return true for valid email formats (not email verification)', () =>{
        expect(validEmail('bob123@gmail.com')).toBe(true)
        expect(validEmail('made_blueprint@blueprint.com')).toBe(true)
    })
    it('return false for invalid email formats', () =>{
        expect(validEmail('made_blueprint@blueprintcom')).toBe(false) 
        expect(validEmail('')).toBe(false) 
    }  )
})