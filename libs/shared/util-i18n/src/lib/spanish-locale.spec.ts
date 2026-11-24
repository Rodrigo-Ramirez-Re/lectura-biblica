import { DatePipe, DecimalPipe } from '@angular/common';
import { LOCALE_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideSpanishLocale } from './spanish-locale';

describe('provideSpanishLocale (LB-004)', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideSpanishLocale(), DatePipe, DecimalPipe],
    });
  });

  it('sets es-MX as the locale', () => {
    expect(TestBed.inject(LOCALE_ID)).toBe('es-MX');
  });

  it('formats dates in Spanish', () => {
    const date = new Date(2026, 11, 3);
    expect(TestBed.inject(DatePipe).transform(date, "EEEE, d 'de' MMMM")).toBe(
      'jueves, 3 de diciembre',
    );
  });

  it('groups thousands with commas and uses a decimal point', () => {
    expect(TestBed.inject(DecimalPipe).transform(1189.5)).toBe('1,189.5');
  });
});
