import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
  	container: {
  		center: true,
  		padding: '1rem',
  		screens: {
  			'2xl': '1400px'
  		}
  	},
  	extend: {
  		fontFamily: {
  			sans: [
  				'Work Sans',
  				'ui-sans-serif',
  				'system-ui',
  				'-apple-system',
  				'BlinkMacSystemFont',
  				'Segoe UI',
  				'Roboto',
  				'Helvetica Neue',
  				'Arial',
  				'Noto Sans',
  				'sans-serif'
  			],
  			serif: [
  				'Lora',
  				'ui-serif',
  				'Georgia',
  				'Cambria',
  				'Times New Roman',
  				'Times',
  				'serif'
  			],
  			mono: [
  				'Inconsolata',
  				'ui-monospace',
  				'SFMono-Regular',
  				'Menlo',
  				'Monaco',
  				'Consolas',
  				'Liberation Mono',
  				'Courier New',
  				'monospace'
  			]
  		},
  		colors: {
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			success: {
  				DEFAULT: 'hsl(var(--success))',
  				foreground: 'hsl(var(--success-foreground))'
  			},
  			warning: {
  				DEFAULT: 'hsl(var(--warning))',
  				foreground: 'hsl(var(--warning-foreground))'
  			},
  			tier: {
  				bronze: 'hsl(var(--tier-bronze))',
  				silver: 'hsl(var(--tier-silver))',
  				gold: 'hsl(var(--tier-gold))',
  				platinum: 'hsl(var(--tier-platinum))',
  				diamond: 'hsl(var(--tier-diamond))'
  			}
  		},
  		borderRadius: {
  			sm: 'var(--radius-sm)',
  			DEFAULT: 'var(--radius-md)',
  			md: 'var(--radius-md)',
  			lg: 'var(--radius-lg)',
  			xl: 'var(--radius-xl)',
  			'2xl': 'var(--radius-2xl)',
  			'3xl': 'var(--radius-3xl)',
  			full: 'var(--radius-full)'
  		},
  		boxShadow: {
  			xs: 'var(--shadow-xs)',
  			sm: 'var(--shadow-sm)',
  			md: 'var(--shadow-md)',
  			lg: 'var(--shadow-lg)',
  			xl: 'var(--shadow-xl)',
  			glow: 'var(--shadow-glow)',
  			'success-glow': 'var(--shadow-success-glow)',
  			'gold-glow': 'var(--shadow-gold-glow)',
  			'2xs': 'var(--shadow-2xs)',
  			'2xl': 'var(--shadow-2xl)'
  		},
  		spacing: {
  			'1': '4px',
  			'2': '8px',
  			'3': '12px',
  			'4': '16px',
  			'5': '20px',
  			'6': '24px',
  			'7': '28px',
  			'8': '32px',
  			'9': '36px',
  			'10': '40px',
  			'11': '44px',
  			'12': '48px',
  			'14': '56px',
  			'16': '64px',
  			'20': '80px',
  			'24': '96px',
  			'28': '112px',
  			'32': '128px',
  			'safe-top': 'env(safe-area-inset-top)',
  			'safe-bottom': 'env(safe-area-inset-bottom)',
  			'safe-left': 'env(safe-area-inset-left)',
  			'safe-right': 'env(safe-area-inset-right)',
  			'0.5': '2px',
  			'1.5': '6px',
  			'2.5': '10px'
  		},
  		minHeight: {
  			touch: '44px',
  			'stat-card': '120px'
  		},
  		minWidth: {
  			touch: '44px'
  		},
  		fontSize: {
  			xs: [
  				'0.75rem',
  				{
  					lineHeight: '1rem'
  				}
  			],
  			sm: [
  				'0.875rem',
  				{
  					lineHeight: '1.25rem'
  				}
  			],
  			base: [
  				'1rem',
  				{
  					lineHeight: '1.5rem'
  				}
  			],
  			lg: [
  				'1.125rem',
  				{
  					lineHeight: '1.75rem'
  				}
  			],
  			xl: [
  				'1.25rem',
  				{
  					lineHeight: '1.75rem'
  				}
  			],
  			'2xl': [
  				'1.5rem',
  				{
  					lineHeight: '2rem'
  				}
  			],
  			'3xl': [
  				'1.875rem',
  				{
  					lineHeight: '2.25rem'
  				}
  			],
  			'4xl': [
  				'2.25rem',
  				{
  					lineHeight: '2.5rem'
  				}
  			],
  			'5xl': [
  				'3rem',
  				{
  					lineHeight: '1'
  				}
  			]
  		},
  		keyframes: {
  			'accordion-down': {
  				from: {
  					height: '0'
  				},
  				to: {
  					height: 'var(--radix-accordion-content-height)'
  				}
  			},
  			'accordion-up': {
  				from: {
  					height: 'var(--radix-accordion-content-height)'
  				},
  				to: {
  					height: '0'
  				}
  			},
  			'fade-in': {
  				'0%': {
  					opacity: '0',
  					transform: 'translateY(8px)'
  				},
  				'100%': {
  					opacity: '1',
  					transform: 'translateY(0)'
  				}
  			},
  			'fade-in-up': {
  				'0%': {
  					opacity: '0',
  					transform: 'translateY(16px)'
  				},
  				'100%': {
  					opacity: '1',
  					transform: 'translateY(0)'
  				}
  			},
  			'scale-in': {
  				'0%': {
  					opacity: '0',
  					transform: 'scale(0.95)'
  				},
  				'100%': {
  					opacity: '1',
  					transform: 'scale(1)'
  				}
  			},
  			'slide-up': {
  				'0%': {
  					transform: 'translateY(100%)'
  				},
  				'100%': {
  					transform: 'translateY(0)'
  				}
  			},
  			'slide-down': {
  				'0%': {
  					transform: 'translateY(-100%)'
  				},
  				'100%': {
  					transform: 'translateY(0)'
  				}
  			},
  			'slide-in-right': {
  				'0%': {
  					transform: 'translateX(100%)'
  				},
  				'100%': {
  					transform: 'translateX(0)'
  				}
  			},
  			'slide-in-left': {
  				'0%': {
  					transform: 'translateX(-100%)'
  				},
  				'100%': {
  					transform: 'translateX(0)'
  				}
  			},
  			'count-up': {
  				'0%': {
  					transform: 'translateY(100%)',
  					opacity: '0'
  				},
  				'100%': {
  					transform: 'translateY(0)',
  					opacity: '1'
  				}
  			},
  			'confetti': {
  				'0%': {
  					transform: 'translateY(-100vh) rotate(0deg)',
  					opacity: '1'
  				},
  				'100%': {
  					transform: 'translateY(100vh) rotate(720deg)',
  					opacity: '0'
  				}
  			},
  			'shake': {
  				'0%, 100%': {
  					transform: 'translateX(0)'
  				},
  				'25%': {
  					transform: 'translateX(-4px)'
  				},
  				'75%': {
  					transform: 'translateX(4px)'
  				}
  			},
  			'pulse-ring': {
  				'0%': {
  					transform: 'scale(0.8)',
  					opacity: '0.8'
  				},
  				'100%': {
  					transform: 'scale(1.4)',
  					opacity: '0'
  				}
  			},
  			'bounce-in': {
  				'0%': {
  					transform: 'scale(0.3)',
  					opacity: '0'
  				},
  				'50%': {
  					transform: 'scale(1.05)'
  				},
  				'70%': {
  					transform: 'scale(0.9)'
  				},
  				'100%': {
  					transform: 'scale(1)',
  					opacity: '1'
  				}
  			},
			'spin-slow': {
				'0%': {
					transform: 'rotate(0deg)'
				},
				'100%': {
					transform: 'rotate(360deg)'
				}
			},
			'float-up-fade': {
				'0%': {
					opacity: '1',
					transform: 'translateY(0) scale(1)'
				},
				'50%': {
					opacity: '1',
					transform: 'translateY(-20px) scale(1.1)'
				},
				'100%': {
					opacity: '0',
					transform: 'translateY(-40px) scale(0.9)'
				}
			},
			'score-pop': {
				'0%': {
					transform: 'scale(0.5)',
					opacity: '0'
				},
				'60%': {
					transform: 'scale(1.2)',
					opacity: '1'
				},
				'100%': {
					transform: 'scale(1)',
					opacity: '1'
				}
			},
			'streak-glow': {
				'0%': {
					transform: 'scale(1)',
					opacity: '0.8'
				},
				'50%': {
					transform: 'scale(1.15)',
					opacity: '1'
				},
				'100%': {
					transform: 'scale(1)',
					opacity: '0.8'
				}
			},
			'correct-glow': {
				'0%': {
					boxShadow: '0 0 0 0 hsl(160 84% 39% / 0.4)'
				},
				'70%': {
					boxShadow: '0 0 0 10px hsl(160 84% 39% / 0)'
				},
				'100%': {
					boxShadow: '0 0 0 0 hsl(160 84% 39% / 0)'
				}
			},
			'wrong-pulse': {
				'0%': {
					backgroundColor: 'hsl(0 84% 60% / 0.15)'
				},
				'50%': {
					backgroundColor: 'hsl(0 84% 60% / 0.25)'
				},
				'100%': {
					backgroundColor: 'hsl(0 84% 60% / 0.15)'
				}
			},
			'phase-in': {
				'0%': {
					opacity: '0',
					transform: 'translateY(12px) scale(0.97)'
				},
				'100%': {
					opacity: '1',
					transform: 'translateY(0) scale(1)'
				}
			},
			'number-count': {
				'0%': {
					transform: 'translateY(8px)',
					opacity: '0'
				},
				'100%': {
					transform: 'translateY(0)',
					opacity: '1'
				}
			}
		},
		animation: {
			'accordion-down': 'accordion-down 0.2s ease-out',
			'accordion-up': 'accordion-up 0.2s ease-out',
			'fade-in': 'fade-in 0.3s ease-out',
			'fade-in-up': 'fade-in-up 0.4s ease-out',
			'scale-in': 'scale-in 0.2s ease-out',
			'slide-up': 'slide-up 0.3s ease-out',
			'slide-down': 'slide-down 0.3s ease-out',
			'slide-in-right': 'slide-in-right 0.3s ease-out',
			'slide-in-left': 'slide-in-left 0.3s ease-out',
			'count-up': 'count-up 0.4s ease-out',
			'confetti': 'confetti 3s ease-out forwards',
			'shake': 'shake 0.4s ease-in-out',
			'pulse-ring': 'pulse-ring 1.5s ease-out infinite',
			'bounce-in': 'bounce-in 0.5s ease-out',
			'spin-slow': 'spin-slow 3s linear infinite',
			'float-up-fade': 'float-up-fade 0.8s ease-out forwards',
			'score-pop': 'score-pop 0.3s ease-out',
			'streak-glow': 'streak-glow 0.6s ease-in-out',
			'correct-glow': 'correct-glow 0.5s ease-out',
			'wrong-pulse': 'wrong-pulse 0.3s ease-in-out',
			'phase-in': 'phase-in 0.4s ease-out forwards',
			'number-count': 'number-count 0.3s ease-out'
		},
  		transitionDuration: {
  			default: '300ms',
  			fast: '150ms',
  			slow: '500ms'
  		},
  		transitionTimingFunction: {
  			'bounce-out': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
  			smooth: 'cubic-bezier(0.4, 0, 0.2, 1)'
  		}
  	}
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;