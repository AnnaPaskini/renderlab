"use client";
import Link from "next/link";
import Balancer from "react-wrap-balancer";
import { Button } from "./button";
export const CTA = () => {
  return (
    <section className="py-60 w-full  overflow-hidden relative z-30">
      <div className="bg-white dark:bg-black">
        <div className="mx-auto w-full relative z-20 sm:max-w-[40rem]  md:max-w-[48rem] lg:max-w-[64rem] xl:max-w-[80rem] bg-gradient-to-br from-slate-800 dark:from-neutral-900 to-gray-900 sm:rounded-2xl">
          <div className="relative -mx-6   sm:mx-0 sm:rounded-2xl overflow-hidden px-6  md:px-8 ">

            <div className="relative px-6 pb-14 pt-20 sm:px-10 sm:pb-20 lg:px-[4.5rem]">
              <h2 className="  text-center text-balance mx-auto text-3xl md:text-5xl font-semibold tracking-[-0.015em] text-white">
                Ready to signup and join the waitlist?
              </h2>
              <p className="mt-4 max-w-[26rem] text-center mx-auto  text-base/6 text-neutral-200">
                <Balancer>
                  Get instant access to our state of the art project and join
                  the waitlist.
                </Balancer>
              </p>

              <div className="relative z-10 mx-auto flex justify-center mt-6">
                <Link href="/workspace">
                  <Button>Join Waitlist</Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
