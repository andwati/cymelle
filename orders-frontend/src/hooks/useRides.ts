import {
    acceptRide,
    cancelRide,
    completeRide,
    getRides,
    requestRide,
    updateRideStatus,
} from "#/api/rides";
import type {CreateRideRequest, RideStatus} from "#/types/ride";
import {useMutation, useQuery, useQueryClient} from "@tanstack/react-query";

export const rideQueryKeys = {
    all: ["rides"] as const,
};

export function useRides() {
    return useQuery({
        queryKey: rideQueryKeys.all,
        queryFn: ({signal}) => getRides(signal),
    });
}

export function useRequestRide() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (request: CreateRideRequest) => requestRide(request),
        onSuccess: () => queryClient.invalidateQueries({queryKey: rideQueryKeys.all}),
    });
}

export function useAcceptRide() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: acceptRide,
        onSuccess: () => queryClient.invalidateQueries({queryKey: rideQueryKeys.all}),
    });
}

export function useCompleteRide() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: completeRide,
        onSuccess: () => queryClient.invalidateQueries({queryKey: rideQueryKeys.all}),
    });
}

export function useCancelRide() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: cancelRide,
        onSuccess: () => queryClient.invalidateQueries({queryKey: rideQueryKeys.all}),
    });
}

export function useUpdateRideStatus() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({id, status}: {id: string; status: RideStatus}) =>
            updateRideStatus(id, status),
        onSuccess: () => queryClient.invalidateQueries({queryKey: rideQueryKeys.all}),
    });
}
