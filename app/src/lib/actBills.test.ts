import { isBillNamedForAct } from '@/lib/actBills'
import { describe, expect, it } from 'vitest'

describe('isBillNamedForAct', () => {
  it('matches an amendment Bill named for the Act', () => {
    expect(
      isBillNamedForAct('Income Tax Act 1947', 'Income Tax (Amendment) Bill')
    ).toBe(true)
  })

  it('matches a numbered amendment Bill in capitals', () => {
    expect(
      isBillNamedForAct(
        'Income Tax Act 1947',
        'INCOME TAX (AMENDMENT NO. 2) BILL'
      )
    ).toBe(true)
    expect(
      isBillNamedForAct(
        'Income Tax Act 1947',
        'Income Tax (Amendment No 3) Bill'
      )
    ).toBe(true)
  })

  it('matches a Code', () => {
    expect(
      isBillNamedForAct('Penal Code 1871', 'Penal Code (Amendment) Bill')
    ).toBe(true)
  })

  it('leaves out a Bill that changes the Act under another name', () => {
    expect(
      isBillNamedForAct('Income Tax Act 1947', 'Finance (Income Taxes) Bill')
    ).toBe(false)
    expect(
      isBillNamedForAct(
        'Income Tax Act 1947',
        'Statutes (Miscellaneous Amendments) Bill'
      )
    ).toBe(false)
  })

  it('keeps brackets that are part of the Act name', () => {
    expect(
      isBillNamedForAct(
        'Land Titles (Strata) Act 1967',
        'Land Titles (Strata) (Amendment) Bill'
      )
    ).toBe(true)
    expect(
      isBillNamedForAct(
        'Land Titles (Strata) Act 1967',
        'Land Titles (Amendment) Bill'
      )
    ).toBe(false)
  })
})
