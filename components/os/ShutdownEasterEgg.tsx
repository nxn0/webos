
import React, { useState, useEffect, useRef } from 'react';

interface LogLine {
    text: string;
    color?: string;
    delay?: number;
    trigger?: string;
}

const HEX_FLOOD = [
  "00000000: 45 4c 46 02 01 01 00 00 00 00 00 00 00 00 00  ELF.............",
  "00000010: 02 00 3e 00 01 00 00 00 40 4a 00 00 00 00 00  ..>.....@J......",
  "00000020: 40 00 00 00 00 00 00 00 08 00 00 00 00 00 00  @...............",
  "00000030: 00 00 00 00 40 00 38 00 09 00 40 00 1c 00 1b  ....@.8...@.....",
  "00000040: 06 00 00 00 05 00 00 00 40 00 00 00 00 00 00  ........@.......",
  "00000050: 40 00 00 00 00 00 00 00 40 00 00 00 00 00 00  @.......@.......",
  "00000060: f8 01 00 00 00 00 00 00 f8 01 00 00 00 00 00  ................",
  "00000070: 08 00 00 00 00 00 00 00 03 00 00 00 04 00 00  ................",
  "00000080: 38 02 00 00 00 00 00 00 38 02 00 00 00 00 00  8.......8.......",
  "00000090: 38 02 00 00 00 00 00 00 1c 00 00 00 00 00 00  8...............",
  "000000a0: 1c 00 00 00 00 00 00 00 01 00 00 00 00 00 00  ................",
  "000000b0: 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00  ................",
  "000000c0: 00 00 00 00 00 00 00 00 54 02 00 00 00 00 00  ........T.......",
  "000000d0: 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00  ................",
  "000000e0: 01 00 00 00 00 00 00 00 01 00 00 00 00 00 00  ................",
  "000000f0: 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00  ................",
  "00000100: 38 02 00 00 00 00 00 00 38 02 00 00 00 00 00  8.......8.......",
  "00000110: 38 02 00 00 00 00 00 00 1c 00 00 00 00 00 00  8...............",
  "00000120: 00 00 00 00 00 00 00 00 01 00 00 00 00 00 00  ................",
  "00000130: 02 00 00 00 00 00 00 00 02 00 00 00 00 00 00  ................",
  "00000140: 00 00 00 00 00 00 00 00 90 90 90 90 90 90 90  ................",
  "00000150: de ad be ef de ad be ef de ad be ef de ad be  ................",
];

const SEQUENCE: LogLine[] = [
    { text: "[  OK  ] Stopped Session 2 of user guest.", delay: 30 },
    { text: "[  OK  ] Removed slice User Slice of guest.", delay: 30 },
    { text: "[  OK  ] Stopped User Manager for UID 1000.", delay: 30 },
    { text: "[  OK  ] Stopping User Manager for UID 1000...", delay: 30 },
    { text: "[  OK  ] Stopped target Graphical Interface.", delay: 30 },
    { text: "[  OK  ] Stopped target Multi-User System.", delay: 30 },
    { text: "[  OK  ] Stopped target Timers.", delay: 30 },
    { text: "[  OK  ] Stopped Daily Cleanup of Temporary Directories.", delay: 30 },
    { text: "[  OK  ] Stopped target System Time Synchronized.", delay: 30 },
    { text: "[  OK  ] Stopped target System Time Set.", delay: 30 },
    { text: "[  OK  ] Stopped target Sound Card.", delay: 30 },
    { text: "[  OK  ] Stopped target Swap.", delay: 30 },
    { text: "[  OK  ] Stopped target Local File Systems.", delay: 30 },
    { text: "[  OK  ] Unmounting /boot/efi...", delay: 60 },
    { text: "[  OK  ] Unmounted /boot/efi.", delay: 30 },
    { text: "[  OK  ] Stopped File System Check on /dev/disk/by-uuid/0000-0000.", delay: 30 },
    { text: "[  OK  ] Removed slice system-systemd\\x2dfsck.slice.", delay: 30 },
    { text: "[  OK  ] Stopped target Local File Systems (Pre).", delay: 30 },
    { text: "[  OK  ] Stopped target Remote File Systems.", delay: 30 },
    { text: "[  OK  ] Stopped target Network.", delay: 30 },
    { text: "[  OK  ] Stopped Network Manager.", delay: 50 },
    { text: "[  OK  ] Stopped WPA supplicant.", delay: 30 },
    { text: "[  OK  ] Stopped D-Bus System Message Bus.", delay: 30 },
    { text: "[  OK  ] Stopped target Basic System.", delay: 30 },
    { text: "[  OK  ] Stopped target Paths.", delay: 30 },
    { text: "[  OK  ] Stopped target Sockets.", delay: 30 },
    { text: "[  OK  ] Stopped target Slices.", delay: 30 },
    { text: "[  OK  ] Stopped target System Initialization.", delay: 30 },
    { text: "[  OK  ] Stopped target Local Encrypted Volumes.", delay: 30 },
    { text: "[  OK  ] Stopped Dispatch Password Requests to Console Directory Watch.", delay: 30 },
    { text: "[  OK  ] Stopped Forward Password Requests to Wall Directory Watch.", delay: 30 },
    { text: "[  OK  ] Stopped Apply Kernel Variables.", delay: 30 },
    { text: "[  OK  ] Stopped Load Kernel Modules.", delay: 30 },
    { text: "[  OK  ] Stopped Create Volatile Files and Directories.", delay: 30 },
    { text: "[  OK  ] Stopped target Local Verity Protected Volumes.", delay: 30 },
    { text: "         Stopping Journal Service...", delay: 80 },
    { text: "[  OK  ] Stopped Journal Service.", delay: 30 },
    { text: "         Starting Re-enable Volatile Files and Directories...", delay: 30 },
    { text: "[  OK  ] Started Re-enable Volatile Files and Directories.", delay: 30 },
    { text: "         Unmounting /sys/kernel/debug...", delay: 30 },
    { text: "[  OK  ] Unmounted /sys/kernel/debug.", delay: 30 },
    { text: "         Unmounting /dev/mqueue...", delay: 30 },
    { text: "[  OK  ] Unmounted /dev/mqueue.", delay: 30 },
    { text: "         Unmounting /sys/kernel/tracing...", delay: 30 },
    { text: "[  OK  ] Unmounted /sys/kernel/tracing.", delay: 30 },
    { text: "[  OK  ] Reached target Unmount All Filesystems.", delay: 30 },
    { text: "[  OK  ] Reached target Late Shutdown Services.", delay: 30 },
    { text: "[  OK  ] Reached target System Shutdown.", delay: 30 },
    { text: "[  OK  ] Reached target System Halt.", delay: 30 },
    { text: "[ 2345.678912] systemd-shutdown[1]: Syncing filesystems and block devices.", delay: 150 },
    { text: "[ 2345.689123] systemd-shutdown[1]: Sending SIGTERM to remaining processes...", delay: 80 },
    { text: "[ 2345.701234] systemd-shutdown[1]: Sending SIGKILL to remaining processes...", delay: 80 },
    { text: "[ 2345.723456] systemd-shutdown[1]: Unmounting file systems.", delay: 80 },
    { text: "[ 2345.734567] [1234]: Remounting '/' read-only with options 'errors=remount-ro'.", delay: 80 },
    { text: "[ 2345.745678] EXT4-fs (sda1): re-mounted. Opts: (null)", delay: 80 },
    { text: "[ 2345.756789] systemd-shutdown[1]: All filesystems unmounted.", delay: 80 },
    { text: "[ 2345.767890] systemd-shutdown[1]: Deactivating swaps.", delay: 50 },
    { text: "[ 2345.778901] systemd-shutdown[1]: Detaching loop devices.", delay: 50 },
    { text: "[ 2345.789012] systemd-shutdown[1]: Detaching DM devices.", delay: 50 },
    { text: "[ 2345.801234] kvm: exiting hardware virtualization", delay: 80 },
    { text: "[ 2345.812345] sd 0:0:0:0: [sda] Synchronizing SCSI cache", delay: 80 },
    { text: "[ 2345.823456] sd 0:0:0:0: [sda] Stopping disk", delay: 250 },
    { text: "[ 2345.900000] ACPI: Preparing to enter system sleep state S5", delay: 150 },
    { text: "[ 2345.920000] Disabling non-boot CPUs...", delay: 120 },
    { text: "[ 2345.950000] smpboot: CPU 1 is now offline", delay: 50 },
    { text: "[ 2345.960000] smpboot: CPU 2 is now offline", delay: 50 },
    { text: "[ 2345.970000] smpboot: CPU 3 is now offline", delay: 50 },
    { text: "[ 2346.000000] reboot: System halted", delay: 500 },
    
    // CPU Halt failure
    { text: "[ 2346.500000] ACPI Error: Hardware did not enter sleep state (20230628/hwxface-576)", color: "text-red-500", delay: 400 },
    { text: "[ 2346.500200] ACPI Error: AE_ERROR, Attempting to halt CPU via legacy method...", color: "text-red-400", delay: 300 },
    { text: "Halt failed: Processor Instruction Fault", color: "text-red-500 font-bold", delay: 400 },
    { text: "KERNEL PANIC: Attempted to kill init! exitcode=0x0000000b", color: "text-red-500 font-bold", delay: 600 },
    { text: "CPU: 0 PID: 1 Comm: systemd-shutdow Not tainted 6.9.420-glass #1", color: "text-white", delay: 50 },
    { text: "Hardware name: WebOS Simulator/VirtualGlass, BIOS 1.0 01/01/2024", color: "text-white", delay: 50 },
    { text: "Call Trace:", color: "text-white", delay: 50 },
    { text: " <TASK>", color: "text-white", delay: 30 },
    { text: " dump_stack_lvl+0x44/0x5c", color: "text-gray-400", delay: 30 },
    { text: " panic+0x118/0x2ed", color: "text-gray-400", delay: 30 },
    { text: " do_exit+0x9f0/0xa60", color: "text-gray-400", delay: 30 },
    { text: " do_group_exit+0x3a/0xa0", color: "text-gray-400", delay: 30 },
    { text: " __x64_sys_exit_group+0x18/0x20", color: "text-gray-400", delay: 30 },
    { text: " do_syscall_64+0x38/0x90", color: "text-gray-400", delay: 30 },
    { text: " entry_SYSCALL_64_after_hwframe+0x63/0xcd", color: "text-gray-400", delay: 30 },
    { text: "RIP: 0033:0x7f8e9a1b29e1", color: "text-white", delay: 80 },
    { text: "Code: Unable to access opcode bytes at RIP 0x7f8e9a1b29e1.", color: "text-red-500", delay: 400 },
    
    // Hex Flood Trigger
    { text: "Dumping physical memory...", color: "text-yellow-400", delay: 200, trigger: "HEX_FLOOD" },
    
    // Recovery
    { text: "---[ end Kernel panic - not syncing: Attempted to kill init! ]---", color: "text-red-500", delay: 1000 },
    { text: "Rebooting in 3 seconds...", color: "text-white", delay: 1000 },
    { text: "Rebooting in 2 seconds...", color: "text-white", delay: 1000 },
    { text: "Rebooting in 1 second...", color: "text-white", delay: 1000 },
    { text: "System Rebooting...", color: "text-blue-400", delay: 500 },
];

export const ShutdownEasterEgg = ({ onClose }: { onClose: () => void }) => {
    const [lines, setLines] = useState<LogLine[]>([]);
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        let isMounted = true;

        const runSequence = async () => {
            for (const line of SEQUENCE) {
                if (!isMounted) break;
                
                await new Promise(r => setTimeout(r, line.delay || 50));
                
                if (!isMounted) break;
                setLines(prev => [...prev, line]);
                
                if (bottomRef.current) {
                    bottomRef.current.scrollIntoView({ behavior: "smooth" });
                }

                if (line.trigger === "HEX_FLOOD") {
                    for (const hex of HEX_FLOOD) {
                        if (!isMounted) break;
                        await new Promise(r => setTimeout(r, 40)); // Fast hex dump
                        setLines(prev => [...prev, { text: hex, color: "text-gray-500 font-mono text-xs" }]);
                        if (bottomRef.current) {
                            bottomRef.current.scrollIntoView({ behavior: "auto" }); // Fast scroll
                        }
                    }
                     // Add some more hex lines to make it look bigger
                     for (let i=0; i<15; i++) {
                        if (!isMounted) break;
                         await new Promise(r => setTimeout(r, 20));
                         setLines(prev => [...prev, { text: "00000" + (160 + i*10).toString(16) + ": 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00  ................", color: "text-gray-500 font-mono text-xs" }]);
                         if (bottomRef.current) {
                            bottomRef.current.scrollIntoView({ behavior: "auto" });
                        }
                     }
                }
            }
            if (isMounted) {
                setTimeout(onClose, 500);
            }
        };

        runSequence();

        return () => { isMounted = false; };
    }, [onClose]);

    return (
        <div className="fixed inset-0 z-[9999] bg-[#0a0a0a] text-green-500 font-mono p-6 md:p-12 overflow-hidden select-none cursor-wait flex flex-col justify-end">
            <div className="max-w-4xl w-full mx-auto space-y-1">
                {lines.map((line, i) => (
                    <div key={i} className={`break-words ${line.color || 'text-green-500/90'}`}>
                        {line.text}
                    </div>
                ))}
                <div ref={bottomRef} className="h-4 w-4 bg-green-500 animate-pulse mt-2"></div>
            </div>
            
            {/* Scanlines Effect */}
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%] z-10"></div>
            <div className="pointer-events-none absolute inset-0 bg-black/10 animate-pulse z-20"></div>
        </div>
    );
};
