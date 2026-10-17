'use client';
import type {ButtonHTMLAttributes,ReactNode} from 'react';
type Props=ButtonHTMLAttributes<HTMLButtonElement>&{tone?:'green'|'red'|'blue'|'white';children:ReactNode};
export default function PushButton({tone='white',children,className='',type='button',...props}:Props){return <button {...props} type={type} className={`bl-push bl-push-${tone} ${className}`}><span className="bl-push-shadow" aria-hidden="true"/><span className="bl-push-edge" aria-hidden="true"/><span className="bl-push-front">{children}</span></button>;}
